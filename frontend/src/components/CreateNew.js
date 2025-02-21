import React, { useState, useEffect } from "react";
import axios from "axios";
const CreateNew = ({ closeModal, taskData, setSuccessMessage }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    date: "",
    taskStatus: "",
    taskCategory: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (taskData) {
      setFormValues({
        name: taskData.name,
        description: taskData.description,
        date: taskData.date,
        taskStatus: taskData.taskStatus,
        taskCategory: taskData.taskCategory,
      });
      setFilePreview(taskData.fileUrl || null);
    }
  }, [taskData]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB.");
        return;
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };
  const validateFields = () => {
    const newErrors = {};
    Object.keys(formValues).forEach((key) => {
      if (!formValues[key]) newErrors[key] = true;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return alert("Please fill in all fields.");
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(formValues).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append("file", file);
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };
      if (taskData) {
        await axios.put(`http://localhost:5000/updateTask/${taskData.id}`, formData, config);
      } else {
        await axios.post("http://localhost:5000/saveUserData", formData, config);
        setSuccessMessage("Task created successfully!");
      }
      alert("Task created successfully!");
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-sky-50 rounded-lg shadow-lg sm:w-3/4 h-5/6 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {taskData ? "Edit Task" : "Create Task"}
              </h3>
              <button
                type="button"
                className="text-red-600 hover:text-red-700"
                onClick={closeModal}
              >
                ✕
              </button>
            </header>
            {/* Main Content */}
            <div className="flex flex-1 overflow-y-auto mt-4">
              {/* Left Side - Form Inputs */}
              <div className={`${taskData ? "w-1/2 pr-4 border-r border-gray-200" : "w-full"}`}>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    placeholder="Task Title"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                  />
                  
                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    rows="2"
                  />
                  <div className="grid grid-cols-3 gap-6">
                    <select
                      name="taskCategory"
                      value={formValues.taskCategory}
                      onChange={handleChange}
                      className={`text-sm px-2 py-2 rounded-lg border ${
                        errors.taskCategory ? "border-red-500" : "border-gray-200"
                      } focus:ring-0 focus:border-blue-500 outline-none transition-all`}
                    >
                      <option value="">Select Category</option>
                      <option value="WORK">WORK</option>
                      <option value="PERSONAL">PERSONAL</option>
                    </select>
                    <input
                      type="date"
                      name="date"
                      value={formValues.date}
                      onChange={handleChange}
                      className={`text-sm px-2 py-2 rounded-lg border ${
                        errors.date ? "border-red-500" : "border-gray-200"
                      } focus:ring-0 focus:border-blue-500 outline-none transition-all`}
                    />
                    <select
                      name="taskStatus"
                      value={formValues.taskStatus}
                      onChange={handleChange}
                      className={`text-sm px-2 py-2 rounded-lg border ${
                        errors.taskStatus ? "border-red-500" : "border-gray-200"
                      } focus:ring-0 focus:border-blue-500 outline-none transition-all`}
                    >
                      <option value="">Select Status</option>
                      <option value="TO-DO">TO-DO</option>
                      <option value="IN-PROGRESS">IN-PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div className="mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      📁 Upload file
                    </label>
                    {filePreview && (
                      <div className="mt-4 relative">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setFilePreview(null)}
                          className="absolute left-12 top-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Right Side - Preview */}
              {taskData && (
                <div className="w-1/2 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Task Details</h3>
                  <div className="space-y-4">
                    <p><strong>Title:</strong> {taskData.name}</p>
                    <p><strong>Description:</strong> {taskData.description}</p>
                    <p><strong>Category:</strong> {taskData.taskCategory}</p>
                    <p><strong>Date:</strong> {taskData.date}</p>
                    <p><strong>Status:</strong> {taskData.taskStatus}</p>
                    {taskData.fileUrl && (
                      <img
                        src={taskData.fileUrl}
                        alt="Current Attachment"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <footer className="border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`${
                    taskData ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                  } text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : (taskData ? "Update Task" : "Create Task")}
                </button>
              </div>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateNew;