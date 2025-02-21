import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL; // ✅ Define API_URL globally

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // ✅ Fetch tasks (Optional, remove if not needed)
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/getTask`);
      if (response.ok) {
        const data = await response.json();
        console.log("Tasks:", data);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []); // ✅ No dependencies needed

  // ✅ Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        alert('Invalid credentials');
        setUsername('');
        setPassword('');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to the server');
    }
  };

  // ✅ Navigate to register page
  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className='h-screen flex items-center justify-center bg-cover bg-center'>
      <form 
        onSubmit={handleSubmit} 
        className="backdrop-blur-md bg-white/30 shadow-lg rounded-lg px-20 pt-16 max-w-lg h-96 w-full mx-auto"
      >
        <h2 className="text-center font-medium bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-rose-500 text-2xl mb-4">
          Login
        </h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          type="submit"
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white w-full p-2 rounded-lg hover:from-pink-500 hover:to-orange-500 transition-colors"
        >
          Login
        </button>
        <div className='pt-3 flex'>
          <p className='text-slate-900 font-medium'>Don't have an account?</p>
          <button
            type="button" 
            onClick={handleRegister}
            className="pl-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-800 to-rose-700 rounded-lg hover:text-white transition-colors"
          >
            Signup
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
