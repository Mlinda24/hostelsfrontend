import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// CSRF helper function
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

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/api/notifications/", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
      console.error("Notifications error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId, markOnly = false) => {
    try {
      const csrfToken = getCookie('csrftoken');
      
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (response.ok) {
        // Update the local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        
        // If we're just marking as read (not opening), update selected notification too
        if (selectedNotification && selectedNotification.id === notificationId) {
          setSelectedNotification(prev => ({ ...prev, read: true }));
        }
        
        if (!markOnly) {
          alert("Notification marked as read!");
        }
      } else {
        console.error("Failed to mark as read:", await response.text());
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const csrfToken = getCookie('csrftoken');
      
      const response = await fetch("http://localhost:8000/api/notifications/mark-all-read/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (response.ok) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        alert("All notifications marked as read!");
      } else {
        console.error("Failed to mark all as read:", await response.text());
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Open/View a notification
  const openNotification = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    
    // Automatically mark as read when opened
    if (!notification.read) {
      markAsRead(notification.id, true); // true = mark only, no alert
    }
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format time only
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading Notifications...</h2>
          <p className="text-gray-500 mt-2">Fetching your notifications</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchNotifications}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center text-gray-600 hover:text-blue-600 mr-4"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">My Notifications</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-medium"
                  >
                    Mark All as Read
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  className="flex items-center text-gray-600 hover:text-blue-600"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="mb-8 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Notification Summary</h2>
                <p className="text-gray-500">
                  {notifications.length} total •{" "}
                  {notifications.filter(n => !n.read).length} unread
                </p>
              </div>
              <div className="text-sm text-gray-500">
                
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-gray-400">🔔</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-6 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => openNotification(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          )}
                          <p className={`text-lg ${!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <small className="text-gray-500">
                            {formatDate(notification.created_at)}
                          </small>
                          {notification.type && (
                            <span className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {notification.type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the notification
                              markAsRead(notification.id, false);
                            }}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                          >
                            Mark as Read
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                            ✓ Read
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotification(notification);
                          }}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* Notification Detail Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Notification</h2>
                <p className="text-gray-500 text-sm">
                  {formatDate(selectedNotification.created_at)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  {!selectedNotification.read && (
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  )}
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedNotification.message}
                  </h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${selectedNotification.read ? 'text-green-600' : 'text-blue-600'}`}>
                      {selectedNotification.read ? 'Read' : 'Unread'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Received</p>
                    <p className="font-medium text-gray-700">
                      {formatTime(selectedNotification.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {!selectedNotification.read && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id, false);
                      closeModal();
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    ✓ Mark as Read & Close
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Notifications;