import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    registrationNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false); // New state for success

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name] || errors.general) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // Frontend validation
    const newErrors = {};
    
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match!";
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Please accept the user guidelines";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration_number: formData.registrationNumber,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - show success message instead of redirecting
        setIsSuccess(true);
      } else {
        // Parse backend errors
        console.log("Backend error response:", data);
        
        if (data.error) {
          const errorMessage = data.error.toLowerCase();
          
          // Check for specific error messages and map to fields
          if (errorMessage.includes("username")) {
            setErrors({ username: "This username is already taken" });
          } else if (errorMessage.includes("email")) {
            setErrors({ email: "This email is already registered" });
          } else if (errorMessage.includes("password")) {
            setErrors({ password: data.error });
          } else if (errorMessage.includes("missing")) {
            if (errorMessage.includes("username")) {
              setErrors({ username: "Username is required" });
            } else if (errorMessage.includes("email")) {
              setErrors({ email: "Email is required" });
            } else if (errorMessage.includes("password")) {
              setErrors({ password: "Password is required" });
            } else {
              setErrors({ general: data.error });
            }
          } else {
            setErrors({ general: data.error });
          }
        } else {
          setErrors({ general: "Signup failed. Please try again." });
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render error messages
  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <p className="text-red-600 text-sm mt-1 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  // Success Message Component
  const SuccessMessage = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Your account has been created. You can now log in to access your account.
        </p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
        >
          Go to Login
        </button>
        
        <button
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              registrationNumber: "",
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
              acceptTerms: false
            });
          }}
          className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200"
        >
          Create Another Account
        </button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-gray-500 text-sm">
          Need help? <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact Support</a>
        </p>
      </div>
    </div>
  );

  // If success, show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <SuccessMessage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8 md:py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-sm md-text-base">
            Join the hundreds looking for hostels just like you. Enjoy the experience.
          </p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </p>
          </div>
        )}

        {/* Signup Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Please fill in your details
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <span className="text-blue-700 font-medium">Student Account</span>
            <p className="text-sm text-blue-600 mt-1">For students looking for accommodation</p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Username */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Username/Regnumber
            </label>
            <input
              type="text"
              name="username"
              placeholder="Mli"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <p className="text-sm text-gray-500 mt-1">This will be your display name</p>
            {renderError('username')}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <p className="text-sm text-gray-500 mt-1">Required for account verification</p>
            {renderError('email')}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {renderError('password')}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-type your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {renderError('confirmPassword')}
          </div>

          {/* Terms Checkbox with Error */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className={`h-5 w-5 rounded mt-1 ${
                errors.acceptTerms ? 'text-red-600' : 'text-blue-600'
              }`}
              required
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-gray-700 text-sm md:text-base">
              Read & Accept our user guidelines
            </label>
          </div>
          {renderError('acceptTerms')}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              "Finish"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm md:text-base">
            Already have account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Login
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-xs md:text-sm">Don't share these credentials with anyone</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-gray-500 text-xs md:text-sm text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;