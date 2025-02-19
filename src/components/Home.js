import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TaskManager from "./TaskManager";
import Board from "./Board";

function Home() {
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // ✅ Define state

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        setSuccessMessage={setSuccessMessage}
        setSearchQuery={setSearchQuery}
        setSelectedCategory={setSelectedCategory} // ✅ Pass to Navbar
      />

      <main className="flex-grow p-4">
      <Routes>
  <Route 
    path="/" 
    element={<TaskManager successMessage={successMessage} searchQuery={searchQuery} selectedCategory={selectedCategory} />} 
  />
  <Route 
    path="board" 
    element={<Board successMessage={successMessage} searchQuery={searchQuery} selectedCategory={selectedCategory} />} 
  />
</Routes>

      </main>

      <Footer />
    </div>
  );
}

export default Home;
