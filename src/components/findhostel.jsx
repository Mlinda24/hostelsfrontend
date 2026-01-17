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
  const navigate = useNavigate();

  // Fetch hostels when component mounts
  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/hostels/", {
        credentials: "include",
      });

      if (response.status === 401) {
        // User not authenticated, redirect to login
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
  const openBookingModal = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
    // Set default dates (tomorrow for check-in, week later for check-out)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 30); // 30 days for monthly booking
    
    setBookingForm({
      check_in_date: tomorrow.toISOString().split('T')[0],
      check_out_date: nextWeek.toISOString().split('T')[0],
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
    try {
      const csrfToken = getCookie('csrftoken');
      
      if (!selectedRoom) {
        alert("No room selected for booking");
        return;
      }

      if (!bookingForm.check_in_date || !bookingForm.check_out_date) {
        alert("Please select both check-in and check-out dates");
        return;
      }

      const response = await fetch("http://localhost:8000/api/bookings/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          check_in_date: bookingForm.check_in_date,
          check_out_date: bookingForm.check_out_date,
          special_requests: bookingForm.special_requests
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(true);
        setShowBookingModal(false);
        setSelectedRoom(null);
        // Refresh hostels to update availability
        fetchHostels();
        
        // Show success message
        setTimeout(() => {
          setBookingSuccess(false);
        }, 3000);
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
          <h2 className="text-xl font-bold text-gray-800">
            Available Hostels ({filteredHostels.length})
          </h2>
          <p className="text-gray-600">
            Found {filteredHostels.reduce((total, hostel) => total + hostel.rooms.length, 0)} available rooms
          </p>
        </div>

        {/* Hostels Grid */}
        {filteredHostels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-gray-400"></span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Opps!! No hostels available at the moment</h3>
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
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Available Rooms</h4>
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
                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                Book Now
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
                  {/* You can add an image field to your Hostel model if needed */}
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
                        className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Book This Room
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

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Book Room</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Room Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">{selectedRoom.room_number}</h3>
                <p className="text-gray-600">{getRoomTypeDisplay(selectedRoom.room_type)} Room</p>
                <p className="text-xl font-bold text-blue-600 mt-2">MK{formatPrice(selectedRoom.price_per_month)}/month</p>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={bookingForm.check_in_date}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={bookingForm.check_out_date}
                    onChange={handleBookingChange}
                    min={bookingForm.check_in_date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Room:</span>
                      <span>{selectedRoom.room_number} - {getRoomTypeDisplay(selectedRoom.room_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per month:</span>
                      <span>MK{formatPrice(selectedRoom.price_per_month)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>Monthly</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Estimated total:</span>
                        <span className="text-blue-600">MK{formatPrice(selectedRoom.price_per_month)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitBooking}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Confirm Booking
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