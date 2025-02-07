
import React, { useState ,useEffect } from "react";
import axios from "axios";

const CreateNew =  ({ closeModal, taskData, setSuccessMessage, }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // State to hold file preview
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    date: "",
    taskStatus: "",
    taskCategory: "",
  });
  useEffect(() => {
    if (taskData) {
      setFormValues({
        name: taskData.name,
        description: taskData.description,
        date: taskData.date,
        taskStatus: taskData.taskStatus,
        taskCategory: taskData.taskCategory,
      });
      if (taskData.fileUrl) {
        setFilePreview(taskData.fileUrl); // Use the existing image URL
      } else {
        setFilePreview(null);
      }
    }
    
  }, [taskData]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission status

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Update error state if the input is cleared
    if (value.length === 0) {
      setErrors((prev) => ({ ...prev, [name]: true }));
    } else {
      // Remove error for this field if it has a value
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  // Handle file upload and preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }

      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB.");
        return;
      }

      setFile(selectedFile);

      // Generate file preview if it's an image
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    }
  };

  // Validate form fields
  const validateFields = () => {
    const newErrors = {};
    Object.keys(formValues).forEach((key) => {
      if (!formValues[key]) {
        newErrors[key] = true; // Set error if field is empty
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Reset errors on focus
  const handleFocus = (e) => {
    const { name } = e.target;
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateFields()) {
      alert("Please fill in all fields.");
      return;
    }
  
    setIsSubmitting(true);
  
    const formData = new FormData();
    Object.keys(formValues).forEach((key) => {
      formData.append(key, formValues[key]);
    });
  
    if (file) {
      formData.append("file", file);
    }
  
    console.log("Data being sent to backend:");
    formData.forEach((value, key) => console.log(`${key}:`, value));
  
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };
  
      let response;
      if (taskData) {
        // Editing an existing task (send a PUT request)
        response = await axios.put(`http://localhost:5000/updateTask/${taskData.id}`, formData, config);  
      } else {
        // Creating a new task (send a POST request)
        response = await axios.post("http://localhost:5000/saveUserData", formData, config);
        setSuccessMessage("Okay Sachin! Task created successfully.");
      }
  
      console.log("Response from Backend:", response.data);
      alert(response.data.message);
      
      closeModal(); // Close the modal after submission
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred while saving data.");
    } finally {
      setIsSubmitting(false);
    }

    setFormValues({
          name: "",
          description: "",
          date: "",
          taskStatus: "",
          taskCategory: "",
        });
        setFile(null);
        setFilePreview(null); // Reset file preview
        setErrors({});
  };
  

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-sky-50 rounded-lg shadow-lg sm:w-3/4 h-5/6 relative overflow-hidden">
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center  border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              {taskData ? "Edit Task" : "Create Task"}
            </h3>
            <button
              className="text-red-600 "
              onClick={closeModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          {/* Form Section */}
          <form
            className="flex-1 overflow-y-auto mt-4 pr-4"
            onSubmit={handleSubmit}
          >
            {/* Task Details */}
            <section className="mb-3">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    placeholder="Task Title"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2">
                      Title is required
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    rows="2"
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-2">
                      Description is required
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Additional Details */}
            <section className="mb-2">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <select
                    name="taskCategory"
                    value={formValues.taskCategory}
                    onChange={handleChange}
                    className={`w-full text-sm px-2 py-2 rounded-lg border ${
                      errors.taskCategory ? "border-red-500" : "border-gray-200"
                    } focus:ring-0 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white`}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="WORK">WORK</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                  {errors.taskCategory && (
                    <p className="text-red-500 text-sm mt-2">
                      Category is required
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="date"
                    name="date"
                    value={formValues.date}
                    onChange={handleChange}
                    className={`w-full text-sm px-2 py-2 rounded-lg border ${
                      errors.date ? "border-red-500" : "border-gray-200"
                    } focus:ring-0 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                    required
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-2">
                      Date is required
                    </p>
                  )}
                </div>

                <div>
                  <select
                    name="taskStatus"
                    value={formValues.taskStatus}
                    onChange={handleChange}
                    className={`w-full text-sm px-2 py-2 rounded-lg border ${
                      errors.taskStatus ? "border-red-500" : "border-gray-200"
                    } focus:ring-0 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white`}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="TO-DO">TO-DO</option>
                    <option value="IN-PROGRESS">IN-PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  {errors.taskStatus && (
                    <p className="text-red-500 text-sm mt-2">
                      Status is required
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Attachment */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Attachment
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="text-gray-500 text-xs">Upload file</span>
              </label>
              {filePreview && (
                <div className="mt-4 flex items-center space-x-4 relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => setFilePreview(null)}
                    className="absolute left-9 top-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

            </section>

            

            {/* Submit Button */}
            <div className="flex justify-end mt-4">
              {taskData ? (
                <button
                  type="submit"
                  className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition duration-300 ease"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    "Update"
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 ease"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    "Create"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNew;

