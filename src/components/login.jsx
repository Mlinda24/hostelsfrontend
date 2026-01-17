// Import necessary React hooks and icons
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this

// Function to get CSRF token from cookies (needed for Django security)
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

// Main Login Component
function Login({ onLogin }) {
  // =============== STATE VARIABLES ===============
  // useState is a React hook that lets you add state to functional components
  const navigate = useNavigate(); // Add this

  
  // 1. username: stores the registration number entered by user
  const [username, setUsername] = useState("");
  
  // 2. password: stores the password entered by user
  const [password, setPassword] = useState("");
  
  // 3. isLoading: shows loading spinner when logging in
  const [isLoading, setIsLoading] = useState(false);
  
  // =============== EVENT HANDLER ===============
  // This function runs when the form is submitted
  async function handleSubmit(e) {
    e.preventDefault(); // Prevents page refresh
    setIsLoading(true); // Show loading state

    try {
      // Send login request to Django backend
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"), // Django security token
        },
        credentials: "include", // Include cookies in request
        body: JSON.stringify({ username, password }), // Convert data to JSON
      });

      if (response.ok) {
        onLogin(); // Call parent function to handle successful login
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsLoading(false); // Hide loading state
    }
  }

  // =============== JSX RENDER ===============
  // This is what gets displayed on the screen
  return (
  // Full-screen container, card centered both vertically & horizontally
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    
    {/* Login Card */}
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 md:p-12">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Chikanda Hostels</h1>
        <p className="text-gray-600">
          Enter your credentials to access your account
        </p>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Username or RegNumber</label>
          <input
            type="text"
            placeholder="eg. Mlinda"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* SIGN UP LINK */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          You don't have an account?{" "}
          <button
              onClick={() => navigate("/signup")} // Change to this

            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Sign up here
          </button>
        </p>
      </div>

      {/* DIVIDER */}
      <div className="my-8 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500 text-sm">Or Use Reg-Number</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* FOOTER NOTE */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-gray-500 text-sm text-center">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

    </div>
  </div>
);
}

export default Login;