
import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";

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
    "COMPLETED": true,
  });

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
        setError(err.response?.data?.error || err.message || "Error fetching tasks.");
      }
    };

    fetchTasks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/saveUserData",
        newTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) => [...prev, response.data]);
      setNewTask({ name: "", date: "", taskStatus: "TO-DO", taskCategory: "Work" });
      setIsAdding(false);
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
      setError(err.response?.data?.error || err.message || "Error updating status.");
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
      setError(err.response?.data?.error || err.message || "Error deleting task.");
    }
  };

  const getTasksByStatus = (status) => tasks.filter((task) => task.taskStatus === status);

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
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
            {status === "TO-DO" ? "Todo" : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()} (
            {getTasksByStatus(status).length})
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
            {status === "TO-DO"  && expandedSections[status] && (
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
                      <td className="py-2 px-4 text-sm">{task.name}</td>
                      <td className="py-2 px-4 text-sm">{task.date}</td>
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
                      <td className="py-2 px-4 text-sm">{task.taskCategory}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 font-semibold text-sm"
                        >
                          delete
                        </button>
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
</div>


  );
};

export default TaskManager;



