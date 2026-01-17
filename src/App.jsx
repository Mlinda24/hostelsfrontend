// App.js - Alternative approach
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/dashboard';
import FindHostel from './components/findhostel';
import Notifications from './components/Notifications';
import MyBookings from './components/mybookings';
import Settings  from './components/settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Check authentication on app load
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/check-auth/', {
          credentials: 'include',
        });
        
        if (isMounted && response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - runs once on mount

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>

      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" />
              )
            } 
          />
          <Route 
            path="/signup" 
            element={
              !isAuthenticated ? (
                <Signup />
              ) : (
                <Navigate to="/dashboard" />
              )
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/findhostel" 
            element={
              isAuthenticated ? (
                <FindHostel />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/notifications" 
            element={
              isAuthenticated ? (
                <Notifications />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          {/* Default route */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            } 
          />
          <Route 
  path="/mybookings" 
  element={
    isAuthenticated ? (
      <MyBookings />
    ) : (
      <Navigate to="/login" />
    )
  } 
/>
        <Route 
  path="/settings" 
  element={
    isAuthenticated ? (
      <Settings />
    ) : (
      <Navigate to="/login" />
    )
  } 
/>
          
          {/* 404 route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;