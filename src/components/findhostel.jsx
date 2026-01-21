import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faUser,
  faBath,
  faMapMarkerAlt,
  faPhone,
  faWalking,
  faHome,
  faArrowLeft,
  faSyncAlt,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faCalendarAlt,
  faComment,
  faReceipt,
  faWallet,
  faUniversity,
  faEnvelope,
  faClock,
  faInfoCircle,
  faBuilding,
  faDoorClosed,
  faMoneyBillWave,
  faCreditCard,
  faMobileAlt,
  faBank,
  faCheck,
  faExclamationCircle,
  faSearch,
  faFilter,
  faTimesCircle,
  faHomeAlt,
  faEye,
  faCouch,
  faUsers,
  faMapPin,
  faHotel,
  faImages,
  faChevronLeft,
  faChevronRight,
  faSpinner
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState({});
  const [slideshowInterval, setSlideshowInterval] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHostels();
    checkBookingLimit();
  }, []);

  // Automatic slideshow effect
  useEffect(() => {
    if (selectedHostel && selectedHostel.images && selectedHostel.images.length > 1) {
      // Clear any existing interval
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
      
      // Start new slideshow interval
      const interval = setInterval(() => {
        nextImage();
      }, 3000); // Change image every 3 seconds
      
      setSlideshowInterval(interval);
      
      // Clean up interval on component unmount or when selectedHostel changes
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear interval if no images or only one image
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
        setSlideshowInterval(null);
      }
    }
  }, [selectedHostel, currentImageIndex]);

  // Mouse events to pause/restart slideshow
  const handleMouseEnter = () => {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      setSlideshowInterval(null);
    }
  };

  const handleMouseLeave = () => {
    if (selectedHostel && selectedHostel.images && selectedHostel.images.length > 1 && !slideshowInterval) {
      const interval = setInterval(() => {
        nextImage();
      }, 3000);
      setSlideshowInterval(interval);
    }
  };

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      roomType: ""
    });
  };

  const openHostelDetails = (hostel) => {
    setSelectedHostel(hostel);
    setCurrentImageIndex(0);
  };

  const openBookingModal = async (room) => {
    console.log("Opening booking modal for room:", room);
    
    await checkBookingLimit();
    
    if (!bookingLimit.canBook) {
      setBookingError(`You have reached the maximum limit of ${bookingLimit.max} active bookings. Please cancel an existing booking before booking a new room.`);
      return;
    }
    
    setSelectedRoom(room);
    setShowBookingModal(true);
    setBookingError("");
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

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
        
        setCurrentBooking({
          id: data.booking_id,
          amount: data.amount,
          room: selectedRoom.room_number,
          hostel: hostels.find(h => h.rooms.some(r => r.id === selectedRoom.id))?.name || "Hostel"
        });
        
        setShowPaymentModal(true);
        fetchHostels();
        checkBookingLimit();
        
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

  const formatPrice = (price) => {
    return price?.toLocaleString('en-US') || "0";
  };

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

  // Image navigation functions
  const nextImage = () => {
    if (selectedHostel && selectedHostel.images && selectedHostel.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === selectedHostel.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedHostel && selectedHostel.images && selectedHostel.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? selectedHostel.images.length - 1 : prevIndex - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleImageLoad = (imageId) => {
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId) => {
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  // Get current image
  const getCurrentImage = () => {
    if (selectedHostel && selectedHostel.images && selectedHostel.images.length > 0) {
      return selectedHostel.images[currentImageIndex];
    }
    return null;
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl" />
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
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded text-sm z-50"
      >
        Debug: {showDebug ? "ON" : "OFF"}
      </button>

      {bookingSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 mr-2" />
            <span className="font-medium">Booking submitted successfully!</span>
          </div>
        </div>
      )}

      {bookingError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-3 rounded-lg shadow-lg flex items-center max-w-md">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2" />
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
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm">
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
              <h1 className="text-2xl font-bold text-gray-800">Find Hostel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
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
                <FontAwesomeIcon icon={faSyncAlt} className="w-5 h-5 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            Search & Filter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div>
  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
    Location / Hostel Name
  </label>
  <div className="relative">
    <input
      type="text"
      name="location"
      value={filters.location}
      onChange={handleFilterChange}
      placeholder="Search location or hostel name"
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
    <FontAwesomeIcon 
      icon={faSearch} 
      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
    />
  </div>
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

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
                <p className="font-medium flex items-center">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                  You have reached the 2-room limit
                </p>
                <p className="text-sm">Cancel a booking to book a new room</p>
              </div>
            )}
          </div>
        </div>

        {filteredHostels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faHotel} className="text-gray-400 text-3xl" />
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
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{hostel.name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-500" />
                        <span>{hostel.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faWalking} className="mr-2 text-gray-500" />
                        <span>{hostel.distance || "Near campus"}</span>
                      </div>
                      {/* Show image count if available */}
                      {hostel.images && hostel.images.length > 0 && (
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <FontAwesomeIcon icon={faImages} className="mr-2" />
                          <span>{hostel.images.length} photo{hostel.images.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openHostelDetails(hostel)}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      View Details
                    </button>
                  </div>
                </div>

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
                              <h5 className="font-medium text-gray-800 flex items-center">
                                {room.room_number} - {getRoomTypeDisplay(room.room_type)}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FontAwesomeIcon icon={faUser} className="mr-1" />
                                  {room.capacity} person{room.capacity !== 1 ? 's' : ''}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FontAwesomeIcon icon={faBed} className="mr-1" />
                                  {room.beds} bed{room.beds !== 1 ? 's' : ''}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FontAwesomeIcon icon={faBath} className="mr-1" />
                                  {room.has_private_bathroom ? "Private" : "Shared"} bathroom
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600 flex items-center justify-end">
                                MK{formatPrice(room.price_per_month)}/month
                              </p>
                              <button
                                onClick={() => openBookingModal(room)}
                                disabled={!bookingLimit.canBook}
                                className={`mt-2 px-4 py-2 rounded-lg font-medium flex items-center ${
                                  bookingLimit.canBook 
                                 ? 'bg-[#455A6480] text-white hover:bg-[#455A64]' 
                                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
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

      {/* UPDATED: Hostel Details Modal with Automatic Slideshow and 3 Dots */}
      {selectedHostel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedHostel.name}</h2>
              <button
                onClick={() => {
                  setSelectedHostel(null);
                  setCurrentImageIndex(0);
                  if (slideshowInterval) {
                    clearInterval(slideshowInterval);
                    setSlideshowInterval(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Image Gallery Section with Automatic Slideshow */}
              <div className="mb-6">
                {selectedHostel.images && selectedHostel.images.length > 0 ? (
                  <div 
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Main Image Display */}
                    <div className="relative h-96 w-full bg-gray-100 rounded-xl overflow-hidden">
                      {imageLoading[getCurrentImage()?.id] !== false && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 text-3xl" />
                        </div>
                      )}
                      <img
                        src={getCurrentImage()?.image_url || getCurrentImage()?.image}
                        alt={getCurrentImage()?.caption || `${selectedHostel.name} - Image ${currentImageIndex + 1}`}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imageLoading[getCurrentImage()?.id] === false ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(getCurrentImage()?.id)}
                        onError={() => handleImageError(getCurrentImage()?.id)}
                      />
                      
                      {/* Navigation Arrows */}
                      {/* Image Counter */}
                      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm z-10">
                        {currentImageIndex + 1} / {selectedHostel.images.length}
                      </div>
                      
                      {/* 3 Dots Slideshow Indicator */}
                      {selectedHostel.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                          {selectedHostel.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => goToImage(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                currentImageIndex === index 
                                  ? 'bg-white scale-110' 
                                  : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Image Caption */}
                      {getCurrentImage()?.caption && (
                        <div className="absolute bottom-12 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
                          <p className="text-white text-sm">{getCurrentImage()?.caption}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {selectedHostel.images.length > 1 && (
                      <div className="flex space-x-2 mt-4 overflow-x-auto py-2">
                        {selectedHostel.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => goToImage(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              currentImageIndex === index 
                                ? 'border-blue-500 ring-2 ring-blue-200 transform scale-105' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={image.image_url || image.image}
                              alt={image.caption || `Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex flex-col items-center justify-center">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-300 text-6xl mb-4" />
                    <p className="text-gray-500">No images available for this hostel</p>
                    <p className="text-gray-400 text-sm">For more details email our admins at Bsc-21-22@unima.ac.mw or contact +265 881 779 699</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
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
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            {room.room_number} - {getRoomTypeDisplay(room.room_type)}
                          </h4>
                          <p className="text-blue-600 font-bold flex items-center">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                            MK{formatPrice(room.price_per_month)}/month
                          </p>
                          <button
                            onClick={() => {
                              setSelectedHostel(null);
                              setCurrentImageIndex(0);
                              if (slideshowInterval) {
                                clearInterval(slideshowInterval);
                                setSlideshowInterval(null);
                              }
                              openBookingModal(room);
                            }}
                            disabled={!bookingLimit.canBook}
                            className={`mt-2 w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                              bookingLimit.canBook 
                                ? 'bg-[#455A6480] text-white hover:bg-[#455A64]' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                            {bookingLimit.canBook ? 'Book This Room' : 'Booking Limit Reached'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Info Panel */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    Quick Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500 mr-3 w-5" />
                      <span className="text-gray-700">{selectedHostel.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="text-gray-500 mr-3 w-5" />
                      <span className="text-gray-700">{selectedHostel.contact || "Not provided"}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faWalking} className="text-gray-500 mr-3 w-5" />
                      <span className="text-gray-700">{selectedHostel.distance || "Near campus"}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faImages} className="text-gray-500 mr-3 w-5" />
                      <span className="text-gray-700">
                        {selectedHostel.images?.length || 0} photo{selectedHostel.images?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedHostel(null);
                    setCurrentImageIndex(0);
                    if (slideshowInterval) {
                      clearInterval(slideshowInterval);
                      setSlideshowInterval(null);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keep existing booking and payment modals exactly as they were */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                Book Room
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                      <FontAwesomeIcon icon={faDoorClosed} className="mr-2" />
                      Room {selectedRoom.room_number}
                    </h3>
                    <p className="text-gray-600 text-sm">{getRoomTypeDisplay(selectedRoom.room_type)}</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600 flex items-center">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                    MK{formatPrice(selectedRoom.price_per_month)}/month
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                    Check-in Date <span className="text-red-500 ml-1">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                    Check-out Date <span className="text-red-500 ml-1">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faComment} className="mr-2" />
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

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                    Booking Summary
                  </h4>
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

                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors w-full sm:w-auto flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={submitBooking}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faWallet} className="mr-2" />
                  Payment Required
                </h2>
                <p className="text-gray-600 text-sm">Booking #{currentBooking.id} created successfully!</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setCurrentBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-800 mb-1">Important Notice</h4>
                    <p className="text-yellow-700 text-sm">
                      Your booking is reserved for <span className="font-bold">24 hours</span>. Complete payment within this time to confirm your room.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  Booking Details
                </h4>
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
                    <p className="font-bold text-green-600 text-lg">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
                      MK{formatPrice(currentBooking.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-yellow-600">Pending Payment</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4">Payment Instructions</h4>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FontAwesomeIcon icon={faMobileAlt} className="mr-2" />
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

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FontAwesomeIcon icon={faBank} className="mr-2" />
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

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-2">Important Notes:</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-500 mt-0.5" />
                    <span>Always include reference <span className="font-mono font-medium">BOOKING-{currentBooking.id}</span> in your payment</span>
                  </li>
                  <li className="flex items-start">
                    <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-500 mt-0.5" />
                    <span>Send payment confirmation to: <span className="font-medium">payments@hostels.ac.mw</span></span>
                  </li>
                  <li className="flex items-start">
                    <FontAwesomeIcon icon={faClock} className="mr-2 text-yellow-500 mt-0.5" />
                    <span>Complete payment within <span className="font-bold">24 hours</span> to avoid cancellation</span>
                  </li>
                  <li className="flex items-start">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500 mt-0.5" />
                    <span>You'll receive email updates about your booking status</span>
                  </li>
                </ul>
              </div>

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
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faHomeAlt} className="mr-2" />
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