import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  // Account form state
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    registration_number: ""
  });
  
  const [originalForm, setOriginalForm] = useState({}); // Store original values
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Check for changes whenever form changes
  useEffect(() => {
    const formChanged = JSON.stringify(accountForm) !== JSON.stringify(originalForm);
    setHasChanges(formChanged);
  }, [accountForm, originalForm]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/api/user/profile/", {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched user data:", data); // Debug log
      setUserData(data);
      
      // Populate account form with user data
      const formData = {
        username: data.username || "",
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone_number: data.phone_number || "",
        registration_number: data.registration_number || ""
      };
      
      setAccountForm(formData);
      setOriginalForm(formData); // Store original values for change detection
      
    } catch (err) {
      console.error("Settings error:", err);
      setSaveMessage({ 
        type: "error", 
        text: "Failed to load account information. Please try again." 
      });
      
      // Fallback to local storage if available
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try {
          const data = JSON.parse(storedUser);
          const formData = {
            username: data.username || "",
            email: data.email || "",
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone_number: data.phone_number || "",
            registration_number: data.registration_number || ""
          };
          setAccountForm(formData);
          setOriginalForm(formData);
        } catch (e) {
          console.error("Failed to parse stored user data:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form changes
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save account information to backend
  const saveAccountInfo = async () => {
    if (!hasChanges) {
      setSaveMessage({ type: "info", text: "No changes to save." });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });
    
    try {
      const csrfToken = getCookie('csrftoken');
      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      console.log("Sending update:", accountForm); // Debug log

      const response = await fetch("http://localhost:8000/api/user/profile/update/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(accountForm),
      });

      const data = await response.json();
      console.log("Update response:", data); // Debug log

      if (response.ok) {
        setSaveMessage({ 
          type: "success", 
          text: data.message || "Account information updated successfully!" 
        });
        setOriginalForm(accountForm); // Update original values
        setHasChanges(false);
        
        // Update local storage if data was stored there
        if (localStorage.getItem('userData')) {
          const storedData = JSON.parse(localStorage.getItem('userData'));
          const updatedData = { ...storedData, ...accountForm };
          localStorage.setItem('userData', JSON.stringify(updatedData));
        }
        
        setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
      } else {
        setSaveMessage({ 
          type: "error", 
          text: data.error || data.detail || "Failed to update account" 
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveMessage({ 
        type: "error", 
        text: `Network error: ${err.message}. Please check your connection.` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to original values
  const resetForm = () => {
    setAccountForm(originalForm);
    setHasChanges(false);
    setSaveMessage({ type: "info", text: "Changes discarded." });
    setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading Account Information...</h2>
          <p className="text-gray-500 mt-2">Fetching your profile data from server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center text-gray-600 hover:text-blue-600 mr-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Account Information</h1>
            </div>
            
            {hasChanges && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {saveMessage.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            saveMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {saveMessage.type === 'success' ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : saveMessage.type === 'error' ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{saveMessage.text}</span>
              </div>
              <button
                onClick={() => setSaveMessage({ type: "", text: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Account Information Card */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {accountForm.first_name || accountForm.username} {accountForm.last_name}
                  </h2>
                  <p className="text-blue-100">{accountForm.email}</p>
                  <p className="text-blue-100 text-sm">@{accountForm.username}</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-blue-100 text-sm">User ID: #{userData?.id || 'N/A'}</p>
                <p className="text-blue-100 text-sm">Last Updated: Today</p>
              </div>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Edit Account Details</h3>
              {hasChanges && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Discard Changes
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Username and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={accountForm.username}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Username cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={accountForm.email}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Used for notifications and login</p>
                </div>
              </div>

              {/* First and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={accountForm.first_name}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={accountForm.last_name}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={accountForm.phone_number}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="+265 XXX XXX XXX"
                />
                <p className="text-sm text-gray-500 mt-1">Used for SMS notifications</p>
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={accountForm.registration_number}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="BSC-COM-21-001"
                />
                <p className="text-sm text-gray-500 mt-1">Your university registration number</p>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <button
                      onClick={saveAccountInfo}
                      disabled={isSaving || !hasChanges}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving to Server...
                        </>
                      ) : (
                        "Save Changes to Server"
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      {hasChanges 
                        ? "Click to save your changes to the server"
                        : "No changes to save"}
                    </p>
                  </div>
                  
                  <button
                    onClick={fetchUserData}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Data Source Information</p>
              <p className="text-sm text-blue-600 mt-1">
                This information is fetched from and saved to the server. 
                Changes are synced in real-time. Username cannot be modified for security reasons.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default Settings;