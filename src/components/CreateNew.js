
import React, { useState ,useEffect } from "react";
import axios from "axios";

const CreateNew =  ({ closeModal, taskData }) => {
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      alert("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    // Prepare form data for submission
    const formData = new FormData();
    
    Object.keys(formValues).forEach((key) => {
      formData.append(key, formValues[key]);
    });
    if (file) {
      formData.append("file", file);
    }


    console.log("Data being sent to backend:");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value); // Logs each key-value pair in the formData
    });


    try {
      const token = localStorage.getItem("token"); // Assuming token is stored in local storage
      const response = await axios.post("http://localhost:5000/saveUserData", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Response from Backend:", response.data); 
      alert(response.data.message); // Notify the user of the success
      closeModal(); // Call closeModal if you want to close the modal after submission
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred while saving data.");
    } finally {
      setIsSubmitting(false);
    }

    // Reset form values and errors after submission if needed
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
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-700">{taskData ? "Edit Task" : "Create Task"}</h2>
            <span
              className="text-gray-600 text-2xl font-bold cursor-pointer hover:text-red-600 transition"
              onClick={closeModal}
            >
              &times;
            </span>
          </header>

          {/* Form Section */}
          <form className="overflow-y-auto mt-6 px-2 flex-grow" onSubmit={handleSubmit}>
            {/* Task Details */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Task Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder="Task Title"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm">Title is mandatory</p>}
                </div>
                <div>
                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder="Description"
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${errors.description ? "border-red-500" : "border-gray-300"} rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    rows="3"
                    required
                  />
                  {errors.description && <p className="text-red-500 text-sm">Description is mandatory</p>}
                </div>
              </div>
            </section>

            {/* Additional Details */}
            <section className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    name="date"
                    value={formValues.date}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${errors.date ? "border-red-500" : "border-gray-300"} rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    required
                  />
                  {errors.date && <p className="text-red-500 text-sm">Date is mandatory</p>}
                </div>
                <div>
                  <select
                    name="taskStatus"
                    value={formValues.taskStatus}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${errors.taskStatus ? "border-red-500" : "border-gray-300"} rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                    required
                  >
                    <option value="">Task Status</option>
                    <option value="TO-DO">TO-DO</option>
                    <option value="IN-PROGRESS">IN-PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  {errors.taskStatus && <p className="text-red-500 text-sm">Task status is mandatory</p>}
                </div>
              </div>
              <div className="mt-4">
                <select
                  name="taskCategory"
                  value={formValues.taskCategory}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  className={`w-full bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border ${errors.taskCategory ? "border-red-500" : "border-gray-300"} rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow`}
                  required
                >
                  <option value="">Task Category</option>
                  <option value="WORK">WORK</option>
                  <option value="PERSONAL">PERSONAL</option>
                </select>
                {errors.taskCategory && <p className="text-red-500 text-sm">Task category is mandatory</p>}
              </div>
            </section>

            {/* Attachment */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Attachment</h3>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full bg-transparent text-gray-700 text-sm border border-gray-300 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-600 hover:border-gray-600 shadow-sm focus:shadow"
              />
              {filePreview && (
                <div className="mt-4">
                  <img
                    src={filePreview}
                    alt="File preview"
                    className="w-16 h-16 object-cover rounded-md"
                  />
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
      {isSubmitting ? <span className="animate-spin">⏳</span> : "Update"}
    </button>
  ) : (
    <button
      type="submit"
      className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 ease"
      disabled={isSubmitting}
    >
      {isSubmitting ? <span className="animate-spin">⏳</span> : "Create"}
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

