import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop } from "react-dnd";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";
import { FaGripVertical } from "react-icons/fa";
import { AiFillCheckCircle } from "react-icons/ai";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CreateNew from "./CreateNew";
import { BiDotsHorizontalRounded } from "react-icons/bi"; // More options icon

const ItemType = "TASK";

const Test1 = ({ successMessage , searchQuery }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: "",
    date: "",
    taskStatus: "TO-DO",
    taskCategory: "Work",
  });
  const [expandedSections, setExpandedSections] = useState({
    "TO-DO": true,
    "IN-PROGRESS": true,
    COMPLETED: true,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showOptions, setShowOptions] = useState(null);

  const [editTask, setEditTask] = useState(null); // State to track the task being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Track modal visibility
  const [shouldRefresh, setShouldRefresh] = useState(false);

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
  }, [shouldRefresh]);

  useEffect(() => {
    if (successMessage) {
      setShouldRefresh((prev) => !prev);
    }
  }, [successMessage]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/updateTaskStatus/${id}`,
        { taskStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, taskStatus: newStatus } : task
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error updating status."
      );
    }
  };

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
      const response = await axios.post(
        "http://localhost:5000/saveUserData",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Response from Backend:", response.data);
      setTasks((prev) => [...prev, response.data]);
      setNewTask({
        name: "",
        date: "",
        taskStatus: "TO-DO",
        taskCategory: "WORK",
      });
      setIsAdding(false);
      if (response.data.success) {
        setTasks((prevTasks) => [...prevTasks, response.data.newTask]); // Update state immediately
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error adding task."
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
    setShouldRefresh((prev) => !prev);
  };
  /////
  const Task = ({ task }) => {
    const [, ref] = useDrag({
      type: ItemType,
      item: { id: task.id, taskStatus: task.taskStatus },
    });
    // Table Under Data
    return (
      <tr ref={ref} className="border-t cursor-pointer text-xs ">
        <td className="py-1 pl-4 w-12">
  <div className="flex items-center gap-1.5">
    <input
      type="checkbox"
      checked={selectedTasks.includes(task.id)}
      onChange={() => handleSelectTask(task.id)}
      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-0"
    />
    <FaGripVertical className="text-gray-400 cursor-move hover:text-gray-600 text-xs" />
    {task.taskStatus === "COMPLETED" ? (
      <AiFillCheckCircle className="text-green-600 w-3.5 h-3.5" />
    ) : (
      <AiFillCheckCircle className="text-gray-400 w-3.5 h-3.5 hover:text-gray-600" />
    )}
  </div>
</td>

        <td
          className={`py-2 px-1 text-gray-700 font-medium max-w-14 min-w-14 truncate whitespace-nowrap overflow-hidden ${
                              task.taskStatus === "COMPLETED"
                                ? "line-through text-gray-500"
                                : ""
                            }`}
          title={task.name}
        >
          {task.name}
        </td>
        <td className="py-2 px-3 text-gray-500 w-64">
          <span className="inline-block min-w-[80px]">{task.date}</span>
        </td>

        <td className="py-2 px-3 w-40">
          {task.fileUrl && (
            <img
              src={task.fileUrl}
              alt="Task Preview"
              className="w-8 h-8 object-cover rounded border border-gray-200"
            />
          )}
        </td>
        <td className="py-3 px-4 w-64">
          <select
            value={task.taskStatus}
            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
            className="px-2 py-0.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 w-26 appearance-none bg-white"
          >
            <option value="TO-DO" className="text-gray-500">
              to-do
            </option>
            <option value="IN-PROGRESS" className="text-yellow-600">
              in-progress
            </option>
            <option value="COMPLETED" className="text-green-600">
              completed
            </option>
          </select>
        </td>

        <td className="py-2 px-3 w-48">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {task.taskCategory}
          </span>
        </td>

        <td className="py-2 px-3 text-right relative ">
          <BiDotsHorizontalRounded
            size={20}
            onClick={() => toggleOptions(task.id)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          />

{showOptions === task.id && (
    <div className="absolute right-1 top-0  z-10 w-16 rounded bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div className="py-1">
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="block w-full px-3 py-1 text-xs text-red-600 hover:bg-gray-100"
        >
          Delete
        </button>
        <button
          onClick={() => handleEditTask(task)}
          className="block w-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
        >
          Edit
        </button>
      </div>
    </div>
  )}



        </td>
      </tr>
    );
  };

  const DropZone = ({ status }) => {
    const [, drop] = useDrop({
      accept: ItemType,
      drop: (item) => handleUpdateStatus(item.id, status),
    });
    // **Filter tasks based on status AND searchQuery**
    const filteredTasks = tasks.filter(
      (task) =>
        task.taskStatus === status &&
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) // ✅ Filtering properly
    );
    return (
      <tbody ref={drop} className="min-h-[50px]">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => <Task key={task.id} task={task} />)
        ) : (
          <tr>
            <td colSpan="5" className="text-center py-4">
            No tasks {searchQuery ? "matching search" : `in ${status.toLowerCase()}`}.
            </td>
          </tr>
        )}
      </tbody>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mx-auto">
        <hr />
        <div>
          <table className="min-w-full ">
            <thead>
              <tr className="">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Due Date</th>
                <th className="py-2 px-4 text-left">File</th>
                <th className="py-2 px-4 text-left">Task Status</th>
                <th className="py-2 px-4 text-left">Task Category</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
          </table>

          {Object.keys(expandedSections).map((status) => (
            <div key={status} className="mt-6">
              <div
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    [status]: !prev[status],
                  }))
                }
                className={`flex justify-between items-center text-xs text-black py-1.5 px-3 rounded-t-md cursor-pointer 
                  ${
                    status === "TO-DO"
                      ? "bg-fuchsia-200"
                      : status === "IN-PROGRESS"
                      ? "bg-cyan-200"
                      : "bg-green-200"
                  } hover:opacity-90`}
              >
                <span>
                  {status} (
                  {tasks.filter((task) => task.taskStatus === status).length})
                </span>
                {expandedSections[status] ? (
                  <MdOutlineExpandLess size={19} />
                ) : (
                  <MdOutlineExpandMore size={19} />
                )}
              </div>
              {expandedSections[status] && (
                <>
                  {status === "TO-DO" && expandedSections[status] && (
                    <div className="py-2">
                      <button
                        onClick={() => setIsAdding(true)}
                        className="text-black text-xs px-3"
                      >
                        + ADD Task
                      </button>
                    </div>
                  )}

                  {status === "TO-DO" && isAdding && (
                    <div className="py-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          name="name"
                          value={newTask.name}
                          onChange={handleInputChange}
                          placeholder="Task Name"
                          className="px-2 py-0.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 w-48"
                        />
                        <input
                          type="date"
                          name="date"
                          value={newTask.date}
                          onChange={handleInputChange}
                          className="px-2 py-0.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 w-30"
                        />
                        <select
                          name="taskStatus"
                          value={newTask.taskStatus}
                          onChange={handleInputChange}
                          className="px-2 py-0.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 w-26 "
                        >
                          <option value="TO-DO" className="text-gray-500">
                            to-do
                          </option>
                          <option
                            value="IN-PROGRESS"
                            className="text-yellow-600"
                          >
                            in-progress
                          </option>
                          <option value="COMPLETED" className="text-green-600">
                            completed
                          </option>
                        </select>

                        <select
                          name="taskCategory"
                          value={newTask.taskCategory}
                          onChange={handleInputChange}
                          className="px-2 py-0.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 w-24"
                        >
                          <option value="WORK">WORK</option>
                          <option value="PERSONAL">PERSONAL</option>
                        </select>
                        <button
                          onClick={handleAddTask}
                          className="bg-purple-500 text-white text-xs px-3 py-1 rounded"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setIsAdding(false)}
                          className="bg-gray-500 text-white text-xs px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <table className="min-w-full bg-white rounded-b-lg overflow-hidden shadow-md text-xs">
                    <DropZone status={status} />
                  </table>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Popup for bulk actions when user checked box*/}
      {showPopup && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white border border-gray-600 px-3 py-2 rounded-full w-11/12 max-w-sm shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-medium bg-gray-800 px-3 py-1 rounded-full">
              {selectedTasks.length} Selected
              <button
                onClick={() => setSelectedTasks([]) || setShowPopup(false)}
                className="text-gray-300 hover:text-white text-[10px] pl-1.5"
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

          {/* Dropdown for status selection when user click to cheack box */}
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


      {error && (
        <div className="bg-red-100 text-red-800 p-4 mt-4 rounded">{error}</div>
      )}
      {isEditModalOpen && (
        <CreateNew closeModal={closeModal} taskData={editTask} />
      )}
    </DndProvider>
  );
};

export default Test1;
