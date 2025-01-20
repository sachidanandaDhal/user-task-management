import React from 'react';
import Navbar from './Navbar.js';
import MainContainer from './MainContainer';
import Footer from './Footer';

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <MainContainer />
      <Footer />
    </div>
  );
}

export default Home;
