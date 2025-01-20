// Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/home';
    } else {
      alert('Invalid credentials');
      setUsername('');
      setPassword('');
    }
  };
  const handleRegister = () => {
    navigate('/register');  // Navigate to the Register page
  };
  

  return (
    <div className='h-screen flex items-center justify-center bg-cover bg-center' >
      <form 
        onSubmit={handleSubmit} 
        className="backdrop-blur-md bg-white/30 shadow-lg rounded-lg px-20 pt-16  max-w-lg h-96 w-full mx-auto "
      >
        <h2 className="text-center font-medium bg-clip-text text-transparent bg-gradient-to-r from-sky-500  to-rose-500 text-2xl mb-4 ">Login</h2>
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
          className="mb-4 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white w-full p-2 rounded-lg hover:from-pink-500 hover:to-orange-500 transition-colors "
        >
          Login
        </button>
        <div className='pt-3 flex '>
        <p className=' text-slate-900 font-medium'>Don't have an account?</p>
        <button
          type="button" 
          onClick={handleRegister}
          className="pl-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-800  to-rose-700  rounded-lg hover:text-white transition-colors "
        >
          Signup
        </button>
        </div>

      </form>
      
    </div>
  );
  
  
};

export default Login;
