import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [dashboardInfo, setDashboardInfo] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First try to get user info from dashboard endpoint
      const dashboardResponse = await fetch("http://localhost:8000/api/dashboard/", {
        credentials: "include",
      });

      if (dashboardResponse.status === 401) {
        navigate("/login");
        return;
      }

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        console.log("Dashboard data:", data);
        
        // Try to get more user details from auth endpoint
        try {
          const authResponse = await fetch("http://localhost:8000/api/check-auth/", {
            credentials: "include",
          });
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log("Auth data:", authData);
            
            // Combine data from both endpoints
            const combinedData = {
              username: authData.user?.username || data.username || "User",
              email: authData.user?.email || "Not available",
              id: authData.user?.id || "N/A",
              ...data
            };
            setUserData(combinedData);
          } else {
            // Use dashboard data only
            setUserData({
              username: data.username || "User",
              email: "Not available",
              id: "N/A",
              ...data
            });
          }
        } catch (authErr) {
          console.log("Auth endpoint failed, using dashboard data only");
          setUserData({
            username: data.username || "User",
            email: "Not available",
            id: "N/A",
            ...data
          });
        }
      } else {
        // Try auth endpoint directly
        try {
          const authResponse = await fetch("http://localhost:8000/api/check-auth/", {
            credentials: "include",
          });
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log("Auth data direct:", authData);
            setUserData({
              username: authData.user?.username || "User",
              email: authData.user?.email || "Not available",
              id: authData.user?.id || "N/A",
              is_authenticated: true
            });
          } else {
            throw new Error("Unable to fetch user data");
          }
        } catch (authErr) {
          // Final fallback: check localStorage
          const storedUser = localStorage.getItem('userData');
          if (storedUser) {
            try {
              const data = JSON.parse(storedUser);
              setUserData(data);
            } catch (e) {
              console.error("Failed to parse stored user data:", e);
              setError("Please login to view your profile");
            }
          } else {
            setError("Unable to load profile. Please login again.");
          }
        }
      }
      
    } catch (err) {
      console.error("Settings error:", err);
      setError("Failed to load account information. Please check if the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/dashboard/", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardInfo(data);
      }
    } catch (err) {
      console.log("Could not fetch dashboard data:", err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading Profile Information...</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch your details</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.77-.833-2.54 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Issue</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchUserData}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Go to Login
            </button>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  fetchUserData();
                  fetchDashboardData();
                }}
                className="flex items-center text-gray-600 hover:text-blue-600 text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          {/* Profile Details */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">
              Account Information
            </h3>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium text-gray-900">{userData?.username || "Not set"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{userData?.email || "Not set"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Authentication</p>
                    <p className="font-medium text-gray-900">Logged In</p>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-purple-800">Important Notice</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      All profile information is managed by the system administrator. 
                      For any changes to your account details, please send email through Bsc-21-22@unima.ac.mw
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Contact Information */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              {/* Why Contact Admin */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800">Contact Administrator For:</h4>
                    <ul className="text-blue-700 text-sm mt-2 space-y-1 ml-4 list-disc">
                      <li>Updating your personal information (name, email, etc.)</li>
                      <li>Changing your account password</li>
                      <li>Reporting incorrect account information</li>
                      <li>Account deactivation requests</li>
                      <li>Booking support and queries</li>
                      <li>Payment-related issues</li>
                      <li>Technical support with the system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm text-gray-500">Support Hours</p>
                    <p className="font-medium">Monday - Friday</p>
                    <p className="text-sm text-gray-600">8:00 AM - 5:00 PM</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm text-gray-500">Email Support</p>
                    <p className="font-medium">Bsc-21-22@unima.ac.mw</p>
                    <p className="text-sm text-gray-600">For account-related issues</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm text-gray-500">Payment Support</p>
                    <div className="flex items-center mt-2">
                      <span className="text-green-600 mr-2">📱</span>
                      <div>
                        <p className="font-medium">+265 881 779 699</p>
                        <a
                          href="https://wa.me/265881779699?text=Hi%20Hostel%20Support%2C%20I%20need%20help%20with%20payment%20or%20bookings."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-700 underline"
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">For payment-related queries</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow hover:shadow-lg transition-all"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => navigate("/mybookings")}
                    className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => navigate("/findhostel")}
                    className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
                  >
                    Find Hostel
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Your profile is read-only for security. Contact admin for any changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Profile last refreshed: {new Date().toLocaleString()} | 
            Your account is managed by system administrators for security
          </p>
        </div>
      </main>
    </div>
  );
}

export default Settings;