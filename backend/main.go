package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var Client *mongo.Client

// Initialize MongoDB Connection
func InitMongoDB() {
	// ✅ Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	mongoURI := os.Getenv("MONGO_URI")
	fmt.Println("Mongo URI:", mongoURI) // ✅ Debugging

	Client, err = mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("MongoDB Client Error:", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = Client.Connect(ctx)
	if err != nil {
		log.Fatal("MongoDB Connection Error:", err)
	}
	fmt.Println("✅ MongoDB Connected Successfully")
}

// User model
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// UserTaskData model
type UserTaskData struct {
	ID           primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID       string             `json:"userId" bson:"userId"`
	Name         string             `json:"name" bson:"name"`
	Date         string             `json:"date" bson:"date"`
	Description  string             `json:"description" bson:"description"`
	TaskStatus   string             `json:"taskStatus" bson:"taskStatus"`
	TaskCategory string             `json:"taskCategory" bson:"taskCategory"`
	FileURL      string             `json:"fileUrl" bson:"fileUrl"`
}

func main() {
	InitMongoDB()
	r := gin.Default()

	// CORS Configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ✅ Default route for testing
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "✅ Backend is running on Render!"})
	})

	// Routes
	r.POST("/register", Register)
	r.POST("/login", Login)
	r.POST("/saveUserData", SaveUserData)
	r.GET("/getTask", getTask)
	r.GET("/files/:id", ServeFile)
	r.DELETE("/deleteTask/:id", deleteTask)
	r.PUT("/updateTaskStatus/:id", UpdateTaskStatus)
	r.PUT("/updateTask/:id", UpdateTask)

	// ✅ Read PORT from Environment (Fix Render Deployment)
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000" // Default port for local testing
	}

	log.Println("✅ Server running on port:", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server run failed:", err)
	}
}

// Save User Task Data
func SaveUserData(c *gin.Context) {
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var data UserTaskData
	var fileURL string

	contentType := c.Request.Header.Get("Content-Type")

	if contentType == "application/json" {
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
			return
		}
		fileURL = "http://localhost:5000/files/default"
	} else {
		if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Failed to parse form data"})
			return
		}

		data.Name = c.PostForm("name")
		data.Date = c.PostForm("date")
		data.Description = c.PostForm("description")
		data.TaskStatus = c.PostForm("taskStatus")
		data.TaskCategory = c.PostForm("taskCategory")

		file, err := c.FormFile("file")
		if err != nil || file.Filename == "" {
			fileID, err := uploadDefaultImage()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload default image"})
				return
			}
			fileURL = fmt.Sprintf("http://localhost:5000/files/%s", fileID.Hex())
		} else {
			fileContent, err := file.Open()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
				return
			}
			defer fileContent.Close()

			fileID, err := uploadFileToGridFS(file.Filename, fileContent)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
				return
			}
			fileURL = fmt.Sprintf("http://localhost:5000/files/%s", fileID.Hex())
		}
	}

	data.UserID = userID
	data.FileURL = fileURL

	collection := Client.Database("taskmanagement").Collection("task_management_data")
	result, err := collection.InsertOne(context.Background(), data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error saving data"})
		return
	}

	// Fetch the newly inserted task using its ID
	var insertedTask UserTaskData
	err = collection.FindOne(context.Background(), bson.M{"_id": result.InsertedID}).Decode(&insertedTask)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error retrieving saved data"})
		return
	}

	// Return the newly created task to the frontend
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Data saved successfully",
		"fileUrl": fileURL,
		"newTask": insertedTask, // Send the inserted task data
	})
}

// Retrieve Image from GridFS
func ServeFile(c *gin.Context) {
	fileID := c.Param("id")

	if fileID == "default" {
		c.File("./image/Default.jpg")
		return
	}

	objectID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	bucket, err := gridfs.NewBucket(Client.Database("taskmanagement"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error accessing GridFS"})
		return
	}

	var buffer []byte
	buf := bytes.NewBuffer(buffer)
	_, err = bucket.DownloadToStream(objectID, buf)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.Data(http.StatusOK, "image/jpeg", buf.Bytes())
}

// Upload File to GridFS
func uploadFileToGridFS(fileName string, fileContent io.Reader) (primitive.ObjectID, error) {
	bucket, err := gridfs.NewBucket(Client.Database("taskmanagement"))
	if err != nil {
		return primitive.ObjectID{}, err
	}

	fileID, err := bucket.UploadFromStream(fileName, fileContent)
	if err != nil {
		return primitive.ObjectID{}, err
	}

	return fileID, nil
}

// Upload Default Image
func uploadDefaultImage() (primitive.ObjectID, error) {
	defaultImagePath := "./image/Default.jpg"
	file, err := os.Open(defaultImagePath)
	if err != nil {
		return primitive.ObjectID{}, err
	}
	defer file.Close()

	return uploadFileToGridFS("Default.jpg", file)
}

// Extract UserID from JWT
func ExtractUserIDFromToken(c *gin.Context) (string, error) {
	tokenString := c.GetHeader("Authorization")
	if tokenString == "" {
		return "", errors.New("no token provided")
	}

	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret"), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return "", errors.New("invalid claims")
	}

	return username, nil
}

// Get Task Data
func getTask(c *gin.Context) {
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	taskStatus := c.Query("status")
	filter := bson.M{"userId": userID}
	if taskStatus != "" {
		filter["taskStatus"] = taskStatus
	}

	collection := Client.Database("taskmanagement").Collection("task_management_data")
	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error retrieving data"})
		return
	}
	defer cursor.Close(context.Background())

	var results []UserTaskData
	for cursor.Next(context.Background()) {
		var data UserTaskData
		if err := cursor.Decode(&data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error decoding data"})
			return
		}
		results = append(results, data)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": results})
}

func deleteTask(c *gin.Context) {
	// Extract the userID from the token
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized", // Token error or missing token
		})
		return
	}

	// Log the userID for debugging purposes
	fmt.Println("User ID from token:", userID)

	// Get the insurance ID from the URL parameter
	insuranceID := c.Param("id")

	// Log the insurance ID passed from frontend
	fmt.Println("Insurance ID passed:", insuranceID)

	// Convert the insuranceID to a MongoDB ObjectID
	objectID, err := primitive.ObjectIDFromHex(insuranceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid insurance ID format", // Error if the ID format is invalid
		})
		return
	}

	// Log the converted objectID
	fmt.Println("Converted ObjectID:", objectID)

	// Access the "task_management_data" collection
	collection := Client.Database("taskmanagement").Collection("task_management_data")

	// Create a filter to ensure that only the insurance data belonging to the logged-in user can be deleted
	filter := bson.M{"_id": objectID, "userId": userID}
	fmt.Println("Delete filter:", filter)

	// Perform the delete operation
	deleteResult, err := collection.DeleteOne(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Error deleting data", // Error occurred during deletion
		})
		return
	}

	// If no document was deleted, it either doesn't exist or the user doesn't have permission to delete it
	if deleteResult.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Data not found or unauthorized to delete", // No matching document or unauthorized
		})
		return
	}

	// Successfully deleted the data
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Insurance data deleted successfully", // Success message
	})
}

// UpdateTask - Updates task data
func UpdateTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Extract UserID from JWT
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var updateData bson.M

	contentType := c.Request.Header.Get("Content-Type")
	if contentType == "application/json" {
		var taskData UserTaskData
		if err := c.ShouldBindJSON(&taskData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		updateData = bson.M{
			"name":         taskData.Name,
			"date":         taskData.Date,
			"description":  taskData.Description,
			"taskStatus":   taskData.TaskStatus,
			"taskCategory": taskData.TaskCategory,
		}
	} else {
		if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
			return
		}

		updateData = bson.M{
			"name":         c.PostForm("name"),
			"date":         c.PostForm("date"),
			"description":  c.PostForm("description"),
			"taskStatus":   c.PostForm("taskStatus"),
			"taskCategory": c.PostForm("taskCategory"),
		}

		file, err := c.FormFile("file")
		if err == nil && file.Filename != "" {
			fileContent, err := file.Open()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
				return
			}
			defer fileContent.Close()

			fileID, err := uploadFileToGridFS(file.Filename, fileContent)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
				return
			}
			updateData["fileUrl"] = fmt.Sprintf("http://localhost:5000/files/%s", fileID.Hex())
		}
	}

	collection := Client.Database("taskmanagement").Collection("task_management_data")

	filter := bson.M{"_id": objectID, "userId": userID}
	update := bson.M{"$set": updateData}

	result, err := collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	if result.ModifiedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or no changes made"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Task updated successfully"})
}

// UpdateTaskStatus allows updating the status of a task (TO-DO, IN-PROGRESS, COMPLETED).
func UpdateTaskStatus(c *gin.Context) {
	// Extract the user ID from the token
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
		})
		return
	}

	// Extract the task ID from the URL parameter
	taskID := c.Param("id")

	// Parse the new status from the request body
	var payload struct {
		TaskStatus string `json:"taskStatus"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request payload",
		})
		return
	}

	// Validate the new status
	validStatuses := map[string]bool{"TO-DO": true, "IN-PROGRESS": true, "COMPLETED": true}
	if !validStatuses[payload.TaskStatus] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid task status",
		})
		return
	}

	// Convert the task ID to a MongoDB ObjectID
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid task ID format",
		})
		return
	}

	// Perform the update
	collection := Client.Database("taskmanagement").Collection("task_management_data")
	filter := bson.M{"_id": objectID, "userId": userID}
	update := bson.M{"$set": bson.M{"taskStatus": payload.TaskStatus}}

	result, err := collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Error updating task status",
		})
		return
	}

	// If no document was updated
	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Task not found or unauthorized to update",
		})
		return
	}

	// Respond with success
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Task status updated successfully",
	})
}

// Register handles user registration and returns a structured JSON response.
func Register(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), 14)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to hash password",
		})
		return
	}

	collection := Client.Database("taskmanagement").Collection("users")
	_, err = collection.InsertOne(context.Background(), bson.M{
		"username": user.Username,
		"password": string(hashedPassword),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to register user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Registration successful",
	})
}

// Login function to authenticate the user and return a JWT token with a structured JSON response.
func Login(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	collection := Client.Database("taskmanagement").Collection("users")
	var foundUser User
	err := collection.FindOne(context.Background(), bson.M{"username": user.Username}).Decode(&foundUser)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid credentials",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(user.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid credentials",
		})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   tokenString,
	})
}
