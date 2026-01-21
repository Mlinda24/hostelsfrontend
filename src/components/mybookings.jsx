import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faHome,
  faArrowLeft,
  faSyncAlt,
  faMoneyBillWave,
  faBuilding,
  faDoorClosed,
  faMapMarkerAlt,
  faPhone,
  faUser,
  faReceipt,
  faExclamationCircle,
  faSpinner,
  faCalendarDay,
  faCalendarCheck,
  faCalendarTimes,
  faCalendar,
  faIdCard,
  faInfoCircle,
  faBan,
  faTimes,
  faMapPin,
  faBed,
  faRuler,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

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

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  // Fetch bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filter when activeFilter or bookings change
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => 
        booking.status.toLowerCase() === activeFilter.toLowerCase()
      );
      setFilteredBookings(filtered);
    }
  }, [activeFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/api/my-bookings/", {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      setBookings(data);
      setFilteredBookings(data);
    } catch (err) {
      setError(err.message);
      console.error("Bookings error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    // Check if booking can be cancelled (only PENDING_PAYMENT)
    const booking = bookings.find(b => b.id === bookingId);
    
    if (booking && booking.status !== 'PENDING_PAYMENT') {
      alert("This booking cannot be cancelled. Please contact admin support for assistance.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return;
    }

    try {
      const csrfToken = getCookie('csrftoken');
      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/cancel/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (response.ok) {
        alert("Booking cancelled successfully");
        fetchBookings(); // Refresh bookings
      } else {
        const errorData = await response.json();
        alert(`Cancellation failed: ${errorData.error || "Please try again"}`);
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    const styles = {
      'pending_payment': "bg-yellow-100 text-yellow-800",
      'payment_received': "bg-blue-100 text-blue-800",
      'approved': "bg-green-100 text-green-800",
      'rejected': "bg-red-100 text-red-800",
      'cancelled': "bg-gray-100 text-gray-800",
      'pending': "bg-yellow-100 text-yellow-800",
      'completed': "bg-green-100 text-green-800",
      'canceled': "bg-gray-100 text-gray-800",
      'default': "bg-gray-100 text-gray-800"
    };

    return styles[statusLower] || styles.default;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "MK0";
    return `MK${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate days until check-in
  const getDaysUntilCheckIn = (checkInDate) => {
    if (!checkInDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn = new Date(checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      const diffTime = checkIn - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return null;
    }
  };

  // Open booking details
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Get status display name
  const getStatusDisplay = (status) => {
    const statusMap = {
      'PENDING_PAYMENT': 'Pending Payment',
      'PAYMENT_RECEIVED': 'Payment Received',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'CANCELLED': 'Cancelled',
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'CANCELED': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="animate-spin text-blue-600 text-5xl mx-auto mb-6"
          />
          <h2 className="text-2xl font-semibold text-gray-700">Loading Bookings...</h2>
          <p className="text-gray-500 mt-2">Fetching your booking history</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 text-center border border-gray-300">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchBookings}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center text-gray-600 hover:text-blue-600 mr-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-1" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchBookings}
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                <FontAwesomeIcon icon={faSyncAlt} className="w-5 h-5 mr-1" />
                Refresh
              </button>
              <button
                onClick={() => navigate("/findhostel")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Book New Hostel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Important Notice</h3>
              <p className="text-red-700 text-sm">
                Bookings cannot be cancelled once submitted. Only bookings with "PENDING_PAYMENT" status can be cancelled. 
                For any changes to other bookings, please contact admin support.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {["all", "PENDING_PAYMENT", "APPROVED", "CANCELLED"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded font-medium ${
                  activeFilter === filter
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {getStatusDisplay(filter)}
                {filter !== "all" && (
                  <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                    {bookings.filter(b => b.status === filter).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List - Exactly like screenshot */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded border border-gray-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-4">
                {activeFilter === "all" 
                  ? "You haven't made any bookings yet." 
                  : `No ${getStatusDisplay(activeFilter).toLowerCase()} bookings found.`}
              </p>
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  View All Bookings
                </button>
              )}
              <div className="mt-6">
                <button
                  onClick={() => navigate("/findhostel")}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Find a Hostel
                </button>
              </div>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const canCancel = booking.status === 'PENDING_PAYMENT';
              
              return (
                <div key={booking.id} className="bg-white rounded border border-gray-300 overflow-hidden">
                  {/* Booking ID badge in top right corner */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      ID: {booking.id}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex">
                      {/* Hostel Image */}
                      <div className="w-32 h-32 mr-4">
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-3xl" />
                        </div>
                      </div>
                      
                      {/* Booking Details */}
                      <div className="flex-1">
                        {/* Hostel Name and Location */}
                        <div className="mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.room?.hostel?.name || "Unknown Hostel"}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm mt-1">
                            <FontAwesomeIcon icon={faMapPin} className="w-4 h-4 mr-1" />
                            <span>{booking.room?.hostel?.location || "Location not specified"}</span>
                          </div>
                        </div>
                        
                        {/* Room Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faBed} className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-gray-700">Single Room</span>
                            </div>
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faRuler} className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-gray-700">2km From Campus</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faCalendarDay} className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-gray-700">Check-in: {formatDate(booking.check_in_date)}</span>
                            </div>
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-gray-700">Check-out: {formatDate(booking.check_out_date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price and Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {formatPrice(booking.total_price || booking.room?.price_per_month)}
                            </div>
                            <div className="text-sm text-gray-500">/Semester</div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(booking.status)}`}>
                              {getStatusDisplay(booking.status)}
                            </span>
                            <button
                              onClick={() => openBookingDetails(booking)}
                              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-600 rounded hover:bg-blue-50"
                            >
                              View Details
                            </button>
                            {canCancel && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm border border-red-200 rounded"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special Requests */}
                    {booking.special_requests && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                        <p className="text-gray-700 text-sm">{booking.special_requests}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Booking Details Modal - Simplified to match screenshot */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBooking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              {/* Hostel Image and Basic Info */}
              <div className="mb-6">
                <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-4xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedBooking.room?.hostel?.name || "Unknown Hostel"}
                </h3>
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faMapPin} className="w-4 h-4 mr-2" />
                  <span>{selectedBooking.room?.hostel?.location || "Location not specified"}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FontAwesomeIcon icon={faBed} className="w-4 h-4 mr-2" />
                  <span>Single Room • 2km From Campus</span>
                </div>
              </div>
              
              {/* Price Section */}
              <div className="bg-blue-50 p-4 rounded mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(selectedBooking.total_price || selectedBooking.room?.price_per_month)}
                    </div>
                    <div className="text-sm text-gray-500">/Semester</div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    ID: {selectedBooking.id}
                  </div>
                </div>
              </div>
              
              {/* Dates */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-3">Stay Period</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500 mb-1">Check-in</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500 mb-1">Check-out</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500 mb-1">Booked On</p>
                  <p className="font-medium">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>
              
              {/* Status */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-2">Booking Status</h4>
                <div className={`p-3 rounded ${getStatusBadge(selectedBooking.status)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getStatusDisplay(selectedBooking.status)}</span>
                    <span className="text-xl">
                      {selectedBooking.status === 'APPROVED' && <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />}
                      {selectedBooking.status === 'PENDING_PAYMENT' && <FontAwesomeIcon icon={faClock} className="text-yellow-600" />}
                      {selectedBooking.status === 'CANCELLED' && <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-2">Special Requests</h4>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-700 text-sm">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}
              
              {/* Cancellation Notice */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 mb-1 text-sm">Cancellation Policy</h4>
                    <p className="text-xs text-red-700">
                      {selectedBooking.status === 'PENDING_PAYMENT' 
                        ? "This booking can still be cancelled as payment is pending."
                        : "This booking cannot be cancelled. Please contact admin support for assistance."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {selectedBooking.status === 'PENDING_PAYMENT' && (
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedBooking.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;