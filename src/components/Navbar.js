import React, { useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FaClipboardList } from "react-icons/fa";
import { MdViewList } from "react-icons/md";
import { CiViewBoard } from "react-icons/ci";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { BiLogOut } from "react-icons/bi";
import { BiSearch, BiX } from "react-icons/bi";
import logo from "../assets/bubu.jpeg";
import CreateNew from "./CreateNew.js";

import { useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ setSearchQuery, setSuccessMessage, setSelectedCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [localSearchQuery, setLocalSearchQuery] = useState(""); // State for input value

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
    setSearchQuery(e.target.value); // 🟢 Update search in parent
  };
  const handleCategorySelect = (category) => {
    setSelectedCategory(category); // ✅ Updates selectedCategory in Home.js
  };

  const handleClear = () => {
    setLocalSearchQuery(""); // ✅ Clear input field
    setSearchQuery(""); // ✅ Clear parent state
  };

  useEffect(() => {
    // Retrieve the username from local storage or decode from the token
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT to get user info
      setUsername(payload.username);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUsername(null);
    navigate("/login");
    console.log("Signed out");
  };

  const handleViewChange = (view) => {
    navigate(view === "List" ? "/home" : "/home/board");
  };

  return (
    <nav className="bg-white p-4 flex flex-col space-y-2">
      {/* First Line */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-3">
          <FaClipboardList className="text-gray-600" />
          <span>TaskBuddy</span>
        </h1>
        <div className="flex items-center space-x-3">
          <img src={logo} alt="User Avatar" className="w-8 h-8 rounded-full" />
          <span> {username ? ` ${username}` : "Account"}</span>
        </div>
      </div>

      {/* Second Line */}
      <div className="flex items-center justify-between">
        {/* View Toggle Buttons */}
        <div className="flex space-x-4">
          <button
            className={`flex items-center space-x-2 font-medium ${
              location.pathname === "/home"
                ? "text-gray-700 border-b-2 border-black"
                : "text-gray-600 hover:text-black"
            }`}
            onClick={() => handleViewChange("List")}
          >
            <MdViewList className="text-xl" />
            <span>List</span>
          </button>

          <button
            className={`flex items-center space-x-2 font-medium ${
              location.pathname === "/home/board"
                ? "text-gray-700 border-b-2 border-black"
                : "text-gray-600 hover:text-black"
            }`}
            onClick={() => handleViewChange("Board")}
          >
            <CiViewBoard className="text-xl" />
            <span>Board</span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center px-3 py-2 text-xs bg-red-100 text-black rounded-md border border-red-200 hover:bg-red-200 focus:ring-1 focus:ring-red-300"
        >
          <BiLogOut className="w-3 h-3 mr-1" /> {/* Smaller Icon */}
          Logout
        </button>
      </div>

      {/* Third Line */}
      <div className="flex items-center justify-between">
        {/* Filters */}
        <div className="flex items-center space-x-4 text-sm">
          {/* Category Filter */}
          <h2>Filter by :</h2>
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-full bg-white px-2 py-2 text-xs ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50">
              Category
              <ChevronDownIcon
                aria-hidden="true"
                className="h-4 w-4 text-gray-400"
              />
            </MenuButton>

            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-none">
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                    onClick={() => handleCategorySelect("WORK")}
                  >
                    WORK
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                    onClick={() => handleCategorySelect("PERSONAL")}
                  >
                    PERSONAL
                  </button>
                )}
              </MenuItem>
              {/* ✅ Reset Option */}
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm font-semibold ${
                      active ? "bg-gray-100 text-red-600" : "text-red-500"
                    }`}
                    onClick={() => handleCategorySelect(null)} // Reset to show all tasks
                  >
                    Reset
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>

          {/* Due Date Filter */}
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-full bg-white px-2 py-2 text-xs ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50">
              Due Date
              <ChevronDownIcon
                aria-hidden="true"
                className="h-4 w-4 text-gray-400"
              />
            </MenuButton>

            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-none">
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    Today
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    This Week
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>

        {/* Search and Add Task */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative">
            <div className="relative flex items-center">
              <BiSearch className="absolute left-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={localSearchQuery}
                onChange={handleSearchChange}
                placeholder="Search"
                className="pl-10 pr-10 border text-sm border-gray-300 rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {localSearchQuery && (
                <BiX
                  className="absolute right-3 text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600"
                  onClick={handleClear}
                />
              )}
            </div>
          </div>
          <button
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-full hover:bg-purple-700"
            onClick={openModal}
          >
            ADD TASK
          </button>
        </div>
      </div>
      {isModalOpen && (
        <CreateNew
          closeModal={closeModal}
          setSuccessMessage={setSuccessMessage}
        />
      )}
    </nav>
  );
};

export default Navbar;
