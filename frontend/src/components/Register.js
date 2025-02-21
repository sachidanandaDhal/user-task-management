// Register.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (response.ok) {
      alert('Registered successfully');
      window.location.href = '/login';
    } else {
      alert('Registration failed');
    }
  };
  const handleLogin = () => {
    navigate('/login');  // Navigate to the Register page
  };

  return (
    <div className='h-screen flex items-center justify-center bg-cover bg-center'>
    <form onSubmit={handleSubmit} className="backdrop-blur-md bg-white/30 shadow-lg rounded-lg px-20 pt-16  max-w-lg h-96 w-full mx-auto">
    <h2 className="text-center font-medium bg-clip-text text-transparent bg-gradient-to-r from-sky-500  to-rose-500 text-2xl mb-4 ">Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500  outline-none"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500  outline-none"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500  outline-none"
      />
      <button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white w-full p-2 rounded-lg hover:from-pink-500 hover:to-orange-500 transition-colors">Register</button>
      <div className='pt-3 flex '>
        <p className=' text-slate-900 font-medium'>Already have an account?</p>
        <button
          type="button" 
          onClick={handleLogin}
          className="pl-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-800  to-rose-700  rounded-lg hover:text-white transition-colors "
        >
          Login
        </button>
        </div>
    </form>
    </div>
  );
};

export default Register;
