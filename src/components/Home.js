import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Test1 from "./Test1"; // List View
import Board from "./Board"; // Board View

function Home() {
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");  // ✅ Added missing state

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar setSuccessMessage={setSuccessMessage} setSearchQuery={setSearchQuery}/>

      <main className="flex-grow p-4">
        <Routes>
          {/* Default Route for List View (matches /home) */}
          <Route path="/" element={<Test1 successMessage={successMessage} searchQuery={searchQuery}/>} />
          
          {/* Board View */}
          <Route path="board" element={<Board successMessage={successMessage} searchQuery={searchQuery} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
