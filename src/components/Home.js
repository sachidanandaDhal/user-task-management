import {React, useState } from 'react';
import Navbar from './Navbar.js';
// import MainContainer from './MainContainer';
import Footer from './Footer';
import { Route, Routes } from "react-router-dom";
import TaskManager from './TaskManager';

function Home() {
  const [successMessage, setSuccessMessage] = useState("");
  return (
    <div className="flex flex-col min-h-screen">
     
        <Navbar setSuccessMessage={setSuccessMessage}/>
        <main className="flex-grow  p-4">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<TaskManager successMessage={successMessage}/>} />
          </Routes>
        </main>
      
      <Footer />
    </div>
  );
}

export default Home;
