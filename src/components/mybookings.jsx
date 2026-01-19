import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    return `MK${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading Bookings...</h2>
          <p className="text-gray-500 mt-2">Fetching your booking history</p>
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
              onClick={fetchBookings}
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
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchBookings}
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => navigate("/findhostel")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Book New Hostel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner - Bookings cannot be cancelled */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.77-.833-2.54 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-800">Important Notice</h3>
              <p className="text-red-700 text-sm">
                Bookings cannot be cancelled once submitted. Only bookings with "PENDING_PAYMENT" status can be cancelled. 
                For any changes to other bookings, please contact admin support.
              </p>
            </div>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {bookings.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Payment</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {bookings.filter(b => b.status === 'PENDING_PAYMENT').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {bookings.filter(b => b.status === 'APPROVED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cancelled</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {bookings.filter(b => b.status === 'CANCELLED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">✗</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-6">
            {["all", "PENDING_PAYMENT", "APPROVED", "CANCELLED"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
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

        {/* Bookings List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-gray-400">📅</span>
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  View All Bookings
                </button>
              )}
              <div className="mt-6">
                <button
                  onClick={() => navigate("/findhostel")}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Find a Hostel
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => {
                const daysUntilCheckIn = getDaysUntilCheckIn(booking.check_in_date);
                const canCancel = booking.status === 'PENDING_PAYMENT';
                
                return (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      {/* Booking Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {booking.room?.room_number || "N/A"} - {booking.room?.hostel?.name || "Unknown Hostel"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {booking.room?.hostel?.location || "Location not specified"}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(booking.status)}`}>
                            {getStatusDisplay(booking.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Check-in</p>
                            <p className="font-medium text-gray-800">{formatDate(booking.check_in_date)}</p>
                            {daysUntilCheckIn > 0 && (
                              <p className="text-sm text-green-600">
                                {daysUntilCheckIn} day{daysUntilCheckIn !== 1 ? 's' : ''} to go
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Check-out</p>
                            <p className="font-medium text-gray-800">{formatDate(booking.check_out_date)}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Total Price</p>
                            <p className="text-xl font-bold text-blue-600">{formatPrice(booking.total_price)}</p>
                          </div>
                        </div>
                        
                        {booking.special_requests && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500">Special Requests</p>
                            <p className="text-gray-700">{booking.special_requests}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => openBookingDetails(booking)}
                          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                        
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-medium rounded-lg"
                          >
                            Cancel Booking
                          </button>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Cannot cancel this booking
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Booking Dates Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📅</span>
                          <span>Booked on: {formatDate(booking.created_at)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">🆔</span>
                          <span>Booking ID: {booking.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Status Banner */}
              <div className={`mb-6 p-4 rounded-lg ${getStatusBadge(selectedBooking.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Status: {getStatusDisplay(selectedBooking.status)}</h3>
                    <p className="text-sm">Booking ID: {selectedBooking.id}</p>
                  </div>
                  <span className="text-2xl">
                    {selectedBooking.status === 'APPROVED' && '✓'}
                    {selectedBooking.status === 'PENDING_PAYMENT' && '⏳'}
                    {selectedBooking.status === 'CANCELLED' && '✗'}
                    {selectedBooking.status === 'PAYMENT_RECEIVED' && '💰'}
                    {selectedBooking.status === 'REJECTED' && '❌'}
                  </span>
                </div>
              </div>
              
              {/* Hostel and Room Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Hostel & Room Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Hostel Details</h4>
                    <p className="text-gray-700">{selectedBooking.room?.hostel?.name || "N/A"}</p>
                    <p className="text-gray-600 text-sm">{selectedBooking.room?.hostel?.location || "N/A"}</p>
                    <p className="text-gray-600 text-sm">Contact: {selectedBooking.room?.hostel?.contact || "N/A"}</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Room Details</h4>
                    <p className="text-gray-700">Room {selectedBooking.room?.room_number || "N/A"}</p>
                    <p className="text-gray-600 text-sm">Type: {selectedBooking.room?.room_type || "N/A"}</p>
                    <p className="text-gray-600 text-sm">Capacity: {selectedBooking.room?.capacity || "N/A"} person(s)</p>
                  </div>
                </div>
              </div>
              
              {/* Dates and Pricing */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dates & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Stay Period</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium">{formatDate(selectedBooking.check_in_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">{formatDate(selectedBooking.check_out_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booked on:</span>
                        <span className="font-medium">{formatDate(selectedBooking.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Payment Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room price:</span>
                        <span className="font-medium">{formatPrice(selectedBooking.room?.price_per_month || selectedBooking.total_price - 20000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking fee:</span>
                        <span className="font-medium">MK20,000</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total cost:</span>
                          <span className="text-blue-600">{formatPrice(selectedBooking.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Special Requests</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}
              
              {/* Cancellation Notice */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.77-.833-2.54 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-red-800 mb-1">Cancellation Policy</h4>
                    <p className="text-sm text-red-700">
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
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBooking(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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