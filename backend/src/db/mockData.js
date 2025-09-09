// Mock data for development when database is not available
export const mockHotels = [
  {
    id: 1,
    name: "Royal Garden Resort",
    description: "Luxury resort with beautiful gardens and excellent service",
    location: "Chiang Mai, Thailand",
    image_url: "/images/hotel1.jpg",
    rating: 4.5,
    price_per_night: 2500,
    amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Gym"],
    created_at: new Date().toISOString()
  }
];

export const mockRooms = [
  {
    id: 1,
    hotel_id: 1,
    room_type: "Deluxe Room",
    room_number: "101",
    price_per_night: 2500,
    capacity: 2,
    amenities: ["King Bed", "Balcony", "Mini Bar", "AC"],
    is_available: true,
    image_url: "/images/room1.jpg"
  },
  {
    id: 2,
    hotel_id: 1,
    room_type: "Suite",
    room_number: "201",
    price_per_night: 4500,
    capacity: 4,
    amenities: ["2 Bedrooms", "Living Room", "Kitchen", "Balcony"],
    is_available: true,
    image_url: "/images/room2.jpg"
  }
];

export const mockUsers = [
  {
    id: 2,
    email: "admin@royalgarden.com",
    first_name: "Admin",
    last_name: "Manager",
    role: "admin",
    created_at: new Date().toISOString()
  }
];

export const mockNotifications = [
  {
    id: 1,
    user_id: 2,
    title: "Welcome to Hotel Management System",
    message: "Your account has been set up successfully.",
    type: "info",
    is_read: false,
    created_at: new Date().toISOString()
  }
];
