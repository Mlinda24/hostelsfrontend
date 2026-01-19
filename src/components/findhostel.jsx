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

function FindHostel() {
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    check_in_date: "",
    check_out_date: "",
    special_requests: ""
  });
  const [filters, setFilters] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    roomType: ""
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [bookingLimit, setBookingLimit] = useState({ active: 0, max: 2, canBook: true });
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const navigate = useNavigate();

  // Fetch hostels and check booking limit when component mounts
  useEffect(() => {
    fetchHostels();
    checkBookingLimit();
  }, []);

  const fetchHostels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/hostels/", {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch hostels: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setHostels(data);
      setFilteredHostels(data);
    } catch (err) {
      setError(err.message);
      console.error("Hostels error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBookingLimit = async () => {
    try {
      setIsCheckingLimit(true);
      const response = await fetch("http://localhost:8000/api/check-booking-limit/", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setBookingLimit({
          active: data.active_bookings,
          max: data.max_allowed,
          canBook: data.can_book_more
        });
      }
    } catch (err) {
      console.error("Error checking booking limit:", err);
    } finally {
      setIsCheckingLimit(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...hostels];
    
    if (filters.location) {
      filtered = filtered.filter(hostel => 
        hostel.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        hostel.name.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.minPrice) {
      filtered = filtered.filter(hostel => 
        hostel.rooms.some(room => room.price_per_month >= parseFloat(filters.minPrice))
      );
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(hostel => 
        hostel.rooms.some(room => room.price_per_month <= parseFloat(filters.maxPrice))
      );
    }
    
    if (filters.roomType) {
      filtered = filtered.map(hostel => ({
        ...hostel,
        rooms: hostel.rooms.filter(room => 
          room.room_type && room.room_type.toLowerCase() === filters.roomType.toLowerCase()
        )
      })).filter(hostel => hostel.rooms.length > 0);
    }
    
    setFilteredHostels(filtered);
  }, [filters, hostels]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      roomType: ""
    });
  };

  // Open hostel details
  const openHostelDetails = (hostel) => {
    setSelectedHostel(hostel);
  };

  // Open booking modal
  const openBookingModal = async (room) => {
    console.log("Opening booking modal for room:", room);
    
    // Check booking limit first
    await checkBookingLimit();
    
    if (!bookingLimit.canBook) {
      setBookingError(`You have reached the maximum limit of ${bookingLimit.max} active bookings. Please cancel an existing booking before booking a new room.`);
      return;
    }
    
    setSelectedRoom(room);
    setShowBookingModal(true);
    setBookingError("");
    // Set default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    setBookingForm({
      check_in_date: tomorrow.toISOString().split('T')[0],
      check_out_date: nextMonth.toISOString().split('T')[0],
      special_requests: ""
    });
  };

  // Handle booking form changes
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit booking
  const submitBooking = async () => {
    console.log("Submit booking clicked!");
    console.log("Selected room:", selectedRoom);
    console.log("Booking form:", bookingForm);
    
    try {
      const csrfToken = getCookie('csrftoken');
      console.log("CSRF Token:", csrfToken);
      
      if (!selectedRoom) {
        alert("No room selected for booking");
        return;
      }

      if (!bookingForm.check_in_date || !bookingForm.check_out_date) {
        alert("Please select both check-in and check-out dates");
        return;
      }

      const bookingData = {
        room_id: selectedRoom.id,
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        special_requests: bookingForm.special_requests
      };
      
      console.log("Sending booking data:", bookingData);

      const response = await fetch("http://localhost:8000/api/bookings/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(bookingData),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setBookingSuccess(true);
        setShowBookingModal(false);
        setSelectedRoom(null);
        
        // Store booking info for payment modal
        setCurrentBooking({
          id: data.booking_id,
          amount: data.amount,
          room: selectedRoom.room_number,
          hostel: hostels.find(h => h.rooms.some(r => r.id === selectedRoom.id))?.name || "Hostel"
        });
        
        // Show payment instructions modal
        setShowPaymentModal(true);
        
        // Refresh hostels and booking limit
        fetchHostels();
        checkBookingLimit();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setBookingSuccess(false);
        }, 5000);
      } else {
        alert(`Booking failed: ${data.error || "Please try again"}`);
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    return price?.toLocaleString('en-US') || "0";
  };

  // Get room type display name
  const getRoomTypeDisplay = (roomType) => {
    if (!roomType) return "Unknown";
    const types = {
      'single': 'Single Room',
      'double': 'Double Room',
      'shared': 'Shared Room',
      'suite': 'Suite',
      'SINGLE': 'Single Room',
      'DOUBLE': 'Double Room',
      'SHARED': 'Shared Room',
      'SUITE': 'Suite'
    };
    return types[roomType] || roomType.charAt(0).toUpperCase() + roomType.slice(1).toLowerCase();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700">Loading Hostels...</h2>
          <p className="text-gray-500 mt-2">Finding available accommodations</p>
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
              onClick={fetchHostels}
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
      {/* Debug Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded text-sm z-50"
      >
        Debug: {showDebug ? "ON" : "OFF"}
      </button>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Booking submitted successfully!</span>
          </div>
        </div>
      )}

      {/* Booking Limit Warning */}
      {bookingError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-3 rounded-lg shadow-lg flex items-center max-w-md">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.77-.833-2.54 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <span className="font-medium">{bookingError}</span>
              <button 
                onClick={() => navigate("/mybookings")}
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                View My Bookings
              </button>
            </div>
            <button 
              onClick={() => setBookingError("")}
              className="ml-4 text-yellow-700 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
              <h1 className="text-2xl font-bold text-gray-800">Find Hostel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Booking Limit Indicator */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                bookingLimit.canBook ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isCheckingLimit ? (
                  <span>Checking...</span>
                ) : (
                  <span>
                    Bookings: {bookingLimit.active}/{bookingLimit.max}
                  </span>
                )}
              </div>
              
              <button
                onClick={fetchHostels}
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search & Filter</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / Hostel Name
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Search location or hostel name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (per month)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  min="0"
                  className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  min="0"
                  className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                name="roomType"
                value={filters.roomType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="shared">Shared Room</option>
                <option value="suite">Suite</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Available Hostels ({filteredHostels.length})
              </h2>
              <p className="text-gray-600">
                Found {filteredHostels.reduce((total, hostel) => total + hostel.rooms.length, 0)} available rooms
              </p>
            </div>
            {!bookingLimit.canBook && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                <p className="font-medium">⚠️ You have reached the 2-room limit</p>
                <p className="text-sm">Cancel a booking to book a new room</p>
              </div>
            )}
          </div>
        </div>

        {/* Hostels Grid */}
        {filteredHostels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-gray-400">🏠</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hostels available at the moment</h3>
            <p className="text-gray-500 mb-4">
              {hostels.length === 0 ? "No hostels available at the moment." : "Try adjusting your filters or check back later"}
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredHostels.map((hostel) => (
              <div key={hostel.id} className="bg-white rounded-xl shadow overflow-hidden">
                {/* Hostel Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{hostel.name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <span className="mr-2">📍</span>
                        <span>{hostel.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">⭐</span>
                        <span>{hostel.rating || "New"} • {hostel.distance || "Near campus"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openHostelDetails(hostel)}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Available Rooms */}
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Available Rooms ({hostel.rooms.length})</h4>
                  {hostel.rooms.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No rooms available in this hostel
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostel.rooms.map((room) => (
                        <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-800">{room.room_number} - {getRoomTypeDisplay(room.room_type)}</h5>
                              <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-sm text-gray-500">👤 {room.capacity} person{room.capacity !== 1 ? 's' : ''}</span>
                                <span className="text-sm text-gray-500">🛏️ {room.beds} bed{room.beds !== 1 ? 's' : ''}</span>
                                <span className="text-sm text-gray-500">🚻 {room.has_private_bathroom ? "Private" : "Shared"} bathroom</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">MK{formatPrice(room.price_per_month)}/month</p>
                              <button
                                onClick={() => openBookingModal(room)}
                                disabled={!bookingLimit.canBook}
                                className={`mt-2 px-4 py-2 rounded-lg font-medium ${
                                  bookingLimit.canBook 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {bookingLimit.canBook ? 'Book Now' : 'Limit Reached'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hostel Details Modal */}
      {selectedHostel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedHostel.name}</h2>
              <button
                onClick={() => setSelectedHostel(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Hostel Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                  <div className="w-full h-64 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">🏠</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">📍</span>
                      <span className="text-gray-700">{selectedHostel.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">📞</span>
                      <span className="text-gray-700">{selectedHostel.contact || "Not provided"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">⭐</span>
                      <span className="text-gray-700">Rating: {selectedHostel.rating || "New"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">🏃</span>
                      <span className="text-gray-700">{selectedHostel.distance || "Near campus"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600">
                  {selectedHostel.description || "A comfortable hostel with all necessary amenities for students."}
                </p>
              </div>

              {/* Rooms Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Rooms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedHostel.rooms.slice(0, 4).map((room) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{room.room_number} - {getRoomTypeDisplay(room.room_type)}</h4>
                      <p className="text-blue-600 font-bold">MK{formatPrice(room.price_per_month)}/month</p>
                      <button
                        onClick={() => {
                          setSelectedHostel(null);
                          openBookingModal(room);
                        }}
                        disabled={!bookingLimit.canBook}
                        className={`mt-2 w-full px-4 py-2 rounded-lg font-medium ${
                          bookingLimit.canBook 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {bookingLimit.canBook ? 'Book This Room' : 'Booking Limit Reached'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedHostel(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800">Book Room</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Room Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Room {selectedRoom.room_number}</h3>
                    <p className="text-gray-600 text-sm">{getRoomTypeDisplay(selectedRoom.room_type)}</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">MK{formatPrice(selectedRoom.price_per_month)}/month</p>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-5">
                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={bookingForm.check_in_date}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={bookingForm.check_out_date}
                    onChange={handleBookingChange}
                    min={bookingForm.check_in_date}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="special_requests"
                    value={bookingForm.special_requests}
                    onChange={handleBookingChange}
                    placeholder="Any special requirements or requests..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Booking Summary */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room:</span>
                      <span className="font-medium">{selectedRoom.room_number} - {getRoomTypeDisplay(selectedRoom.room_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per month:</span>
                      <span className="font-medium">MK{formatPrice(selectedRoom.price_per_month)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Fee:</span>
                      <span className="font-medium">MK20,000</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-base">
                        <span>Total to pay:</span>
                        <span className="text-green-600">MK{formatPrice(selectedRoom.price_per_month + 20000)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitBooking}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT INSTRUCTIONS MODAL */}
      {showPaymentModal && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Required</h2>
                <p className="text-gray-600 text-sm">Booking #{currentBooking.id} created successfully!</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setCurrentBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Important Notice */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.77-.833-2.54 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-yellow-800 mb-1">Important Notice</h4>
                    <p className="text-yellow-700 text-sm">
                      Your booking is reserved for <span className="font-bold">24 hours</span>. Complete payment within this time to confirm your room.
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Booking ID:</span>
                    <p className="font-medium">#{currentBooking.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Room:</span>
                    <p className="font-medium">{currentBooking.room} ({currentBooking.hostel})</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount to Pay:</span>
                    <p className="font-bold text-green-600 text-lg">MK{formatPrice(currentBooking.amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-yellow-600">Pending Payment</p>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4">Payment Instructions</h4>
                <div className="space-y-4">
                  {/* Mobile Money Options */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">📱</span>
                      Mobile Money Payment
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">Airtel Money</p>
                          <p className="text-sm text-gray-600">+265 881 234 567</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">BOOKING-{currentBooking.id}</p>
                          <p className="text-xs text-gray-500">Reference</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">TNM Mpamba</p>
                          <p className="text-sm text-gray-600">+265 991 234 567</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">BOOKING-{currentBooking.id}</p>
                          <p className="text-xs text-gray-500">Reference</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">🏦</span>
                      Bank Transfer
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium">National Bank of Malawi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium">1001234567</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-medium">Hostels Booking System</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-mono font-medium">BOOKING-{currentBooking.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-2">Important Notes:</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Always include reference <span className="font-mono font-medium">BOOKING-{currentBooking.id}</span> in your payment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Send payment confirmation to: <span className="font-medium">payments@hostels.ac.mw</span></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⏰</span>
                    <span>Complete payment within <span className="font-bold">24 hours</span> to avoid cancellation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📧</span>
                    <span>You'll receive email updates about your booking status</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setCurrentBooking(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors w-full sm:w-auto"
                  >
                    I Understand
                  </button>
                  <button
                    onClick={() => navigate("/mybookings")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  >
                    Go to My Bookings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindHostel;