import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import CreateNew from "./CreateNew";

const ItemType = "TASK";

const Board = ({ successMessage, searchQuery }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    "TO-DO": true,
    "IN-PROGRESS": true,
    COMPLETED: true,
  });
  const [showOptions, setShowOptions] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
        console.error("Error fetching tasks:", err);
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
      setShouldRefresh((prev) => !prev);
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/deleteTask/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShouldRefresh((prev) => !prev);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleEditTask = (task) => {
    setEditTask(task);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setEditTask(null);
    setShouldRefresh((prev) => !prev);
  };

  const Task = ({ task }) => {
    const [, ref] = useDrag({
      type: ItemType,
      item: { id: task.id, taskStatus: task.taskStatus },
    });

    return (
      <div
        ref={ref}
        className="bg-white shadow-md rounded-lg p-4 mb-2 relative cursor-pointer"
      >
        <p className="font-semibold truncate text-sm mb-6" title={task.name}>
          {task.name}
        </p>
        <div className="flex justify-between text-xs text-gray-500">
          <p>{task.taskCategory}</p>
          <p>{task.date}</p>
        </div>
        <BiDotsHorizontalRounded
          size={20}
          onClick={() =>
            setShowOptions(task.id === showOptions ? null : task.id)
          }
          className="absolute top-2 right-2 text-gray-500 cursor-pointer hover:text-black"
        />
        {showOptions === task.id && (
          <div className="absolute right-2 top-8 bg-white shadow-lg rounded-lg w-24 z-10">
            <button
              onClick={() => handleEditTask(task)}
              className="block w-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="block w-full px-3 py-1 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
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
      <div ref={drop} className="min-h-[50px] p-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => <Task key={task.id} task={task} />)
        ) : (
          <div className="text-center text-gray-500 italic">
            No tasks{" "}
            {searchQuery ? "matching search" : `in ${status.toLowerCase()}`}.
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-3 gap-4 text-xs">
        {["TO-DO", "IN-PROGRESS", "COMPLETED"].map((status) => (
          <div key={status} className="bg-gray-100 rounded-lg shadow-md">
            <div
              className={`flex justify-between items-center p-3 rounded-t-lg cursor-pointer ${
                status === "TO-DO"
                  ? "bg-fuchsia-200"
                  : status === "IN-PROGRESS"
                  ? "bg-cyan-200"
                  : "bg-green-200"
              }`}
              onClick={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  [status]: !prev[status],
                }))
              }
            >
              <span className="font-semibold">
                {status} (
                {tasks.filter((task) => task.taskStatus === status).length})
              </span>
              {expandedSections[status] ? (
                <MdOutlineExpandLess size={20} />
              ) : (
                <MdOutlineExpandMore size={20} />
              )}
            </div>
            {expandedSections[status] && <DropZone status={status} />}
          </div>
        ))}
      </div>
      {isEditModalOpen && (
        <CreateNew closeModal={closeModal} taskData={editTask} />
      )}
    </DndProvider>
  );
};

export default Board;
