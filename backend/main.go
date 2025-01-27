package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var Client *mongo.Client

// Initialize MongoDB connection
func InitMongoDB() {
	var err error
	Client, err = mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = Client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
}

// User model
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// InsuranceData model
type InsuranceData struct {
	ID           string `json:"id,omitempty" bson:"_id,omitempty"`
	UserID       string `json:"userId" bson:"userId"`
	Name         string `json:"name" bson:"name"`
	Date         string `json:"date" bson:"date"`
	Description  string `json:"description" bson:"description"`
	TaskStatus   string `json:"taskStatus" bson:"taskStatus"`
	TaskCategory string `json:"taskCategory" bson:"taskCategory"`
	FileID       string `json:"fileId" bson:"fileId"`
}

func main() {
	InitMongoDB()
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // Ensure this matches the frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Set up routes
	r.POST("/register", Register)
	r.POST("/login", Login)
	r.POST("/saveUserData", SaveUserData)
	r.GET("/getTask", getTask)
	r.DELETE("/deleteTask/:id", deleteTask)
	r.PUT("/updateTaskStatus/:id", UpdateTaskStatus)

	if err := r.Run(":5000"); err != nil {
		log.Fatal("Server run failed:", err)
	}
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

	collection := Client.Database("auth_demo").Collection("users")
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

	collection := Client.Database("auth_demo").Collection("users")
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

func SaveUserData(c *gin.Context) {
	// Extract user ID from JWT token (assuming you have this part set up)
	userID, err := ExtractUserIDFromToken(c)

	// Parse the form data
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // Limit upload size to 10MB
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Failed to parse form data",
		})
		return
	}

	// Retrieve form fields
	name := c.PostForm("name")
	date := c.PostForm("date")
	description := c.PostForm("description")
	taskStatus := c.PostForm("taskStatus")
	taskCategory := c.PostForm("taskCategory")

	// Handle file upload
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No file uploaded",
		})
		return
	}

	// Open the uploaded file
	fileContent, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer fileContent.Close()

	// Initialize the GridFS bucket
	bucket, err := gridfs.NewBucket(Client.Database("auth_demo"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error initializing GridFS bucket"})
		return
	}

	// Upload the file to GridFS
	fileID, err := bucket.UploadFromStream(file.Filename, fileContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	// Create InsuranceData entry and save it to MongoDB
	data := InsuranceData{
		UserID:       userID,
		Name:         name,
		Date:         date,
		Description:  description,
		TaskStatus:   taskStatus,
		TaskCategory: taskCategory,
		FileID:       fileID.Hex(), // Save the GridFS file ID
	}

	// Insert data into MongoDB collection
	collection := Client.Database("auth_demo").Collection("insurance_data")
	_, err = collection.InsertOne(context.Background(), data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving metadata"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "Data saved successfully",
		"fileId":   fileID.Hex(),
		"fileName": file.Filename,
		"fileUrl":  fmt.Sprintf("/files/%s", fileID.Hex()),
	})
}

// ExtractUserIDFromToken extracts User ID from JWT token.
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
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}

	return claims["username"].(string), nil
}

func getTask(c *gin.Context) {
	userID, err := ExtractUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
		})
		return
	}

	// Optional filter for task status
	taskStatus := c.Query("status")

	filter := bson.M{"userId": userID}
	if taskStatus != "" {
		filter["taskStatus"] = taskStatus
	}

	collection := Client.Database("auth_demo").Collection("insurance_data")
	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Error retrieving data",
		})
		return
	}
	defer cursor.Close(context.Background())

	var results []InsuranceData
	for cursor.Next(context.Background()) {
		var data InsuranceData
		if err := cursor.Decode(&data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Error decoding data",
			})
			return
		}
		results = append(results, data)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
	})
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

	// Access the "insurance_data" collection
	collection := Client.Database("auth_demo").Collection("insurance_data")

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
	collection := Client.Database("auth_demo").Collection("insurance_data")
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
