import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Registration, 2: Verification
  const [formData, setFormData] = useState({
    registrationNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    verificationCode: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

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

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

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
        // Move to verification step
        setVerificationEmail(formData.email);
        setStep(2);
      } else {
        // Parse backend errors
        console.log("Backend error response:", data);
        
        if (data.error) {
          const errorMessage = data.error.toLowerCase();
          
          if (errorMessage.includes("username")) {
            setErrors({ username: "This username is already taken" });
          } else if (errorMessage.includes("email")) {
            setErrors({ email: "This email is already registered" });
          } else if (errorMessage.includes("password")) {
            setErrors({ password: data.error });
          } else if (errorMessage.includes("verification")) {
            setErrors({ email: "Failed to send verification email. Please check your email address." });
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

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.verificationCode) {
      setErrors({ verificationCode: "Please enter the verification code" });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/verify-email/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verificationEmail,
          verification_code: formData.verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Account successfully created and verified
        setIsSuccess(true);
      } else {
        setErrors({ verificationCode: data.error || "Invalid verification code" });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrors({});
    
    if (!verificationEmail) {
      setErrors({ general: "No email found for resending verification" });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/resend-verification/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verificationEmail
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setErrors({ success: "New verification code sent to your email!" });
      } else {
        setErrors({ general: data.error || "Failed to resend verification code" });
      }
    } catch (error) {
      console.error("Resend error:", error);
      setErrors({ general: "Network error. Please try again." });
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Verified Successfully!</h2>
        <p className="text-gray-600 mb-4">
          Your email has been verified and your account is now active.
        </p>
        <p className="text-sm text-gray-500">
          A welcome email has been sent to {verificationEmail || formData.email}
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
            setStep(1);
            setFormData({
              registrationNumber: "",
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
              acceptTerms: false,
              verificationCode: ""
            });
            setVerificationEmail("");
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

  // Verification Step Component
  const VerificationStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">
          We sent a verification code to:
        </p>
        <p className="text-blue-600 font-semibold mt-1">{verificationEmail}</p>
        <p className="text-sm text-gray-500 mt-2">
          Enter the code below to complete your registration.
        </p>
      </div>

      {/* Success message for resend */}
      {errors.success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {errors.success}
          </p>
        </div>
      )}

      {/* Verification Form */}
      <form onSubmit={handleVerificationSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Verification Code
          </label>
          <input
            type="text"
            name="verificationCode"
            placeholder="Enter the 6-digit code"
            value={formData.verificationCode}
            onChange={handleChange}
            maxLength="6"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center text-xl font-mono ${
              errors.verificationCode ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            autoComplete="off"
            inputMode="numeric"
          />
          {renderError('verificationCode')}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify & Create Account"
            )}
          </button>
          
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="w-full border-2 border-blue-600 text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
          >
            Resend Code
          </button>
          
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setFormData(prev => ({ ...prev, verificationCode: "" }));
              setErrors({});
            }}
            className="w-full border-2 border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200"
          >
            Back to Registration
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800 font-medium">Can't find the email?</p>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Click "Resend Code" to send a new one</li>
              <li>• The code expires in 10 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Registration Step Component
  const RegistrationStep = () => (
    <>
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Create Account
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
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
      <form onSubmit={handleRegistrationSubmit} className="space-y-6">

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
            autoComplete="username"
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
            autoComplete="email"
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
            autoComplete="new-password"
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
            autoComplete="new-password"
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
            "Continue"
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm md:text-base">
          Already have account?{" "}
          <button
            type="button"
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
    </>
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
        {step === 1 ? <RegistrationStep /> : <VerificationStep />}
      </div>
    </div>
  );
}

export default Signup;