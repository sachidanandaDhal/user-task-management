import React from 'react';
import Navbar from './Navbar.js';
import MainContainer from './MainContainer';
import Footer from './Footer';
import { Route, Routes } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
     
        <Navbar />
        <main className="flex-grow  p-4">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<MainContainer />} />
            {/* Route for About page */}
            {/* <Route path="/about" element={<About />} /> */}
            {/* Route for Contact page */}
            {/* <Route path="/contact" element={<Contact />} /> */}
          </Routes>
        </main>
      
      <Footer />
    </div>
  );
}

export default Home;
