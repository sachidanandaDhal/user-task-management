import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";
import { FaGripVertical } from "react-icons/fa"; // Drag icon
import { AiOutlineCheckCircle, AiFillCheckCircle } from "react-icons/ai";
import { BiDotsHorizontalRounded } from "react-icons/bi"; // More options icon
import CreateNew from "./CreateNew";

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: "",
    date: "",
    taskStatus: "TO-DO",
    taskCategory: "Work",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    "TO-DO": true,
    "IN-PROGRESS": true,
    COMPLETED: true,
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showOptions, setShowOptions] = useState(null);

  const [editTask, setEditTask] = useState(null); // State to track the task being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Track modal visibility

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found. Please log in again.");

        const response = await axios.get("http://localhost:5000/getTask", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTasks(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.error || err.message || "Error fetching tasks."
        );
      }
    };

    fetchTasks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
  
    setIsAdding(true);
  
    // Prepare form data for submission
    const formData = new FormData();
    
    Object.keys(newTask).forEach((key) => {
      formData.append(key, newTask[key]);
    });
  
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
      setTasks((prev) => [...prev, response.data]);
      setNewTask({
        name: "",
        date: "",
        taskStatus: "TO-DO",
        taskCategory: "Work",
      });
      setIsAdding(false);
      if (response.data.success) {
        setTasks((prevTasks) => [...prevTasks, response.data.newTask]); // Update state immediately
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error adding task.");
    }
  };
  

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const updatedTasks = tasks.map((task) =>
        task.id === id ? { ...task, taskStatus: newStatus } : task
      );

      await axios.put(
        `http://localhost:5000/updateTaskStatus/${id}`,
        { taskStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(updatedTasks);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error updating status."
      );
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/deleteTask/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error deleting task."
      );
    }
  };

  const getTasksByStatus = (status) =>
    tasks.filter((task) => task.taskStatus === status);

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleSelectTask = (id) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]
    );
    setShowPopup(true);
  };

  const handleBulkDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedTasks.map((id) =>
          axios.delete(`http://localhost:5000/deleteTask/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      setTasks((prev) =>
        prev.filter((task) => !selectedTasks.includes(task.id))
      );
      setSelectedTasks([]);
      setShowPopup(false);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error deleting tasks."
      );
    }
  };
  const toggleOptions = (taskId) => {
    // Toggle options for the clicked task, close others
    setShowOptions((prev) => (prev === taskId ? null : taskId));
  };

  const handleEditTask = (task) => {
    setEditTask(task); // Set the task to edit
    setIsEditModalOpen(true); // Open the edit modal
  };

  // Close modal (can be passed to the CreateNew component)
  const closeModal = () => {
    setIsEditModalOpen(false); // Close the modal
    setEditTask(null); // Reset the task being edited
  };

  return (
    <div className="mx-auto">
      <div className="">
        {/* Column Headers */}
        <table className="min-w-full ">
          <thead>
            <tr className="">
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Due Date</th>
              <th className="py-2 px-4 text-left">Task Status</th>
              <th className="py-2 px-4 text-left">Task Category</th>
              <th className="py-2 px-4 text-center">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Task Sections */}
        {["TO-DO", "IN-PROGRESS", "COMPLETED"].map((status) => (
          <div key={status} className="mt-6">
            {/* Section header */}
            <div
              onClick={() => toggleSection(status)}
              className={`flex justify-between items-center text-sm text-black py-2 px-4 rounded-t-lg cursor-pointer ${
                status === "TO-DO"
                  ? "bg-fuchsia-200"
                  : status === "IN-PROGRESS"
                  ? "bg-cyan-200"
                  : "bg-green-200"
              }`}
            >
              <span>
                {status === "TO-DO"
                  ? "Todo"
                  : status.charAt(0).toUpperCase() +
                    status.slice(1).toLowerCase()}{" "}
                ({getTasksByStatus(status).length})
              </span>
              {expandedSections[status] ? (
                <MdOutlineExpandLess size={24} />
              ) : (
                <MdOutlineExpandMore size={24} />
              )}
            </div>

            {/* Task list table */}
            {expandedSections[status] && (
              <>
                {/* Add task form when 'isAdding' is true + add task is top in todo under  */}
                {status === "TO-DO" && expandedSections[status] && (
                  <div className="py-4 ">
                    <button
                      onClick={() => setIsAdding(true)}
                      className=" text-black px-4"
                    >
                      + ADD Task
                    </button>
                  </div>
                )}
                {/*task input show in todo under in top */}
                {status === "TO-DO" && isAdding && (
                  <div className="py-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <input
                        type="text"
                        name="name"
                        value={newTask.name}
                        onChange={handleInputChange}
                        placeholder="task name"
                        className="p-2 border rounded w-64"
                      />
                      <input
                        type="date"
                        name="date"
                        value={newTask.date}
                        onChange={handleInputChange}
                        className="p-2 border rounded"
                      />
                      <select
                        name="taskStatus"
                        value={newTask.taskStatus}
                        onChange={handleInputChange}
                        className="p-2 border rounded"
                      >
                        <option value="TO-DO">to-do</option>
                        <option value="IN-PROGRESS">in-progress</option>
                        <option value="COMPLETED">completed</option>
                      </select>
                      <select
                        name="taskCategory"
                        value={newTask.taskCategory}
                        onChange={handleInputChange}
                        className="p-2 border rounded"
                      >
                        <option value="Work">work</option>
                        <option value="Personal">personal</option>
                      </select>
                      <button
                        onClick={handleAddTask}
                        className="bg-purple-500 text-white px-4 py-2 rounded"
                      >
                        add
                      </button>
                      <button
                        onClick={() => setIsAdding(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Task List Table */}
                <table className="min-w-full bg-white rounded-b-lg overflow-hidden shadow-md">
                  <tbody>
                    {getTasksByStatus(status).length > 0 ? (
                      getTasksByStatus(status).map((task) => (
                        <tr key={task.id} className="border-t">
                          <td className="py-2 px-4 flex items-center gap-2">
                            {/* Drag and drop icon */}

                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={() => handleSelectTask(task.id)}
                            />
                            <FaGripVertical className="text-gray-500 cursor-pointer" />

                            {/* Status-dependent icon */}
                            {task.taskStatus === "COMPLETED" ? (
                              <AiFillCheckCircle className="text-blue-500" />
                            ) : (
                              <AiOutlineCheckCircle className="text-gray-500" />
                            )}
                          </td>
                          <td
                            className={`py-2 px-4 text-sm ${
                              task.taskStatus === "COMPLETED"
                                ? "line-through text-gray-500"
                                : ""
                            }`}
                          >
                            {task.name}
                          </td>
                          <td className="py-2 px-4 text-sm">{task.date}</td>
                          <td>
  <img src={task.fileUrl} alt="Task Image" width="40" />
</td>

                          <td className="py-2 px-4 text-center flex items-center justify-center gap-2">
                            <select
                              value={task.taskStatus}
                              onChange={(e) =>
                                handleUpdateStatus(task.id, e.target.value) 
                              }
                              className="p-1 text-sm border rounded"
                            >
                              <option value="TO-DO">to-do</option>
                              <option value="IN-PROGRESS">in-progress</option>
                              <option value="COMPLETED">completed</option>
                            </select>
                          </td>
                          <td className="py-2 px-4 text-sm">
                            {task.taskCategory}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {/* More options button */}
                            <BiDotsHorizontalRounded
                              size={24}
                              onClick={() => toggleOptions(task.id)}
                            />

                            {showOptions === task.id && (
                              <div className="absolute mt-2 bg-white shadow-lg rounded border">
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="px-4 py-2 text-red-500"
                                >
                                  Delete
                                </button>
                                <button onClick={() => handleEditTask(task)} className="px-4 py-2 text-blue-500">Edit</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          no tasks in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* {pop up when user multipul select task } */}

                {showPopup && (
                  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white border border-gray-600 p-4 rounded-full w-11/12 max-w-md shadow-lg flex items-center gap-4">
                    {/* Selected tasks text */}
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold bg-gray-800 px-4 py-1 rounded-full">
                        {selectedTasks.length} Task(s) Selected
                        <button
                          onClick={() =>
                            setSelectedTasks([]) || setShowPopup(false)
                          }
                          className="text-gray-100 hover:text-white text-xs pl-2"
                        >
                          ✕
                        </button>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="clearSelection"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setShowPopup(false) || setSelectedTasks([]); // Clear all selected tasks
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>

                    {/* Dropdown for status selection */}
                    <div className="flex items-center gap-2">
                      <select
                        id="status"
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const token = localStorage.getItem("token");
                            await Promise.all(
                              selectedTasks.map((id) =>
                                axios.put(
                                  `http://localhost:5000/updateTaskStatus/${id}`,
                                  { taskStatus: newStatus },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                )
                              )
                            );

                            // Update the tasks state locally
                            setTasks((prev) =>
                              prev.map((task) =>
                                selectedTasks.includes(task.id)
                                  ? { ...task, taskStatus: newStatus }
                                  : task
                              )
                            );
                            setSelectedTasks([]); // Clear selected tasks
                            setShowPopup(false); // Close the popup
                          } catch (err) {
                            setError(
                              err.response?.data?.error ||
                                err.message ||
                                "Error updating tasks."
                            );
                          }
                        }}
                        className="p-2 text-xs bg-black text-white border border-gray-600 rounded-lg appearance-none focus:outline-none"
                      >
                        <option value="" disabled selected>
                          Status
                        </option>
                        <option value="TO-DO">TO-DO</option>
                        <option value="IN-PROGRESS">IN-PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-500 px-4 py-2 text-white rounded-full text-sm font-bold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 mt-4 rounded">
            {error}
          </div>
        )}
      </div>
         {isEditModalOpen && <CreateNew closeModal={closeModal} taskData={editTask} />}
    </div>
  );
};

export default TaskManager;
