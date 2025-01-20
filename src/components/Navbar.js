import React, { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FaClipboardList } from "react-icons/fa";
import { MdViewList, MdViewModule } from "react-icons/md";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const Navbar = () => {
  const [activeView, setActiveView] = useState("List"); // State to track the active view

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <nav className="bg-white shadow-md p-4 flex flex-col space-y-2">
      {/* First Line */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-3">
          <FaClipboardList className="text-gray-600" />
          <span>TaskBuddy</span>
        </h1>
        <div className="flex items-center space-x-3">
          <img
            src="https://via.placeholder.com/40"
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span>Aravind</span>
        </div>
      </div>

      {/* Second Line */}
      <div className="flex items-center justify-between">
        {/* View Toggle Buttons */}
        <div className="flex space-x-4">
          <button
            className={`flex items-center space-x-2 font-medium ${
              activeView === "List" ? "text-gray-700 border-b-2 border-black" : "text-gray-600 hover:text-black"
            }`}
            onClick={() => handleViewChange("List")}
          >
            <MdViewList className="text-xl" />
            <span>List</span>
          </button>
          <button
            className={`flex items-center space-x-2 font-medium ${
              activeView === "Board" ? "text-gray-700 border-b-2 border-black" : "text-gray-600 hover:text-black"
            }`}
            onClick={() => handleViewChange("Board")}
          >
            <MdViewModule className="text-xl" />
            <span>Board</span>
          </button>
        </div>

        {/* Logout Button */}
        <button className="text-gray-600 hover:text-red-600 font-medium">
          Logout
        </button>
      </div>

      {/* Third Line */}
      <div className="flex items-center justify-between">
        {/* Filters */}
        <div className="flex items-center space-x-4">
          {/* Category Filter */}
          <h2>Filter by</h2>
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50">
              Category
              <ChevronDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
            </MenuButton>
            <MenuItems
              className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-none"
            >
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    Work
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
                    Personal
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>

          {/* Due Date Filter */}
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50">
              Due Date
              <ChevronDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
            </MenuButton>
            <MenuItems
              className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-none"
            >
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
            <input
              type="text"
              placeholder="Search"
              className="border border-gray-300 rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <span className="absolute top-2.5 right-3 text-gray-400 material-icons">
              search
            </span>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
            ADD TASK
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
