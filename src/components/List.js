import React, {useState} from "react";
import CreateNew from "./CreateNew.js";
// import UserTaskData from './UserTaskData';


const MainContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  return (
    <div className="">
      <header className="flex justify-between items-center mb-8">
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={openModal} // open modal on click
          >
            Create New Account
          </button>
        </div>
      </header>
      {isModalOpen && <CreateNew closeModal={closeModal} />}
    </div>
  );
};

export default MainContent;
