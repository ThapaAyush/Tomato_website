import { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Login from './components/Login/Login'
import Add from './pages/Add/Add' 
import List from './pages/List/List' 
import Orders from './pages/Orders/Orders' 
import Customers from './pages/Customers/Customers'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const [token, setToken] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get("token");
      const queryRole = params.get("role");
      const queryEmail = params.get("email");
      const queryName = params.get("name");
      const queryPasswordHashKey = params.get("passwordHashKey");

      if (queryToken && queryRole === "Admin") {
        localStorage.setItem("token", queryToken);
        localStorage.setItem("role", "Admin");
        if (queryEmail) localStorage.setItem("userEmail", queryEmail);
        if (queryName) localStorage.setItem("userName", queryName);
        if (queryPasswordHashKey) localStorage.setItem("passwordHashKey", queryPasswordHashKey);
        window.history.replaceState({}, document.title, window.location.pathname);
        return queryToken;
      }

      const savedToken = localStorage.getItem("token");
      const savedRole = localStorage.getItem("role");
      if (savedToken && savedRole === "Admin") {
        return savedToken;
      }
    } catch (e) {
      console.error("Error reading initial auth token:", e);
    }
    return "";
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get("token");
      const queryRole = params.get("role");
      const queryEmail = params.get("email");
      const queryName = params.get("name");
      const queryPasswordHashKey = params.get("passwordHashKey");

      if (queryToken && queryRole === "Admin") {
        localStorage.setItem("token", queryToken);
        localStorage.setItem("role", "Admin");
        if (queryEmail) localStorage.setItem("userEmail", queryEmail);
        if (queryName) localStorage.setItem("userName", queryName);
        if (queryPasswordHashKey) localStorage.setItem("passwordHashKey", queryPasswordHashKey);
        setToken(queryToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error("Error processing auth query parameters:", e);
    }
  }, []);

  const handleLoginSuccess = (authData) => {
    setToken(authData.token);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("passwordHashKey");
    setToken("");
    toast.success("Logged out of Admin Panel");
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://food-frontend-plum.vercel.app";
    setTimeout(() => {
      window.location.href = `${frontendUrl}/?login=true`;
    }, 300);
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      {!token ? (
        <Login url={url} onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <Navbar onLogout={handleLogout} />
          <hr />
          <div className="app-content">
            <Sidebar />
            <Routes>
              <Route path="/" element={<Customers url={url} />} />
              <Route path="/add" element={<Add url={url} />} />
              <Route path="/list" element={<List url={url} />} />
              <Route path="/orders" element={<Orders url={url} />} />
              <Route path="/customers" element={<Customers url={url} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  )
}

export default App

