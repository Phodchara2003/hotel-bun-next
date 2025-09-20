// This script simulates exactly what frontend API does
const axios = require('axios');

// Create axios instance exactly like frontend
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function simulateFrontendAPI() {
  try {
    console.log('🎭 Simulating exact frontend API call...');
    
    // Get room 9 first
    const roomResponse = await api.get('/admin/rooms/9');
    const room = roomResponse.data.data;
    console.log('📋 Room 9 current data:', JSON.stringify(room, null, 2));
    
    // Simulate frontend formData mapping (like in page.jsx openModal function)
    const formData = {
      name: room.name || '',
      type: room.type || 'standard',
      number: room.room_number || room.number || `R${room.id || ''}`,
      floor: room.floor || '1',
      capacity: room.max_guests || room.capacity || 2,
      price: room.price_per_night || room.price || 1500,
      description: room.description || '',
      amenities: (() => {
        try {
          if (room.amenities) {
            if (typeof room.amenities === 'string') {
              return JSON.parse(room.amenities);
            } else if (Array.isArray(room.amenities)) {
              return room.amenities;
            }
          }
          return [];
        } catch (e) {
          console.error('Error parsing amenities:', e);
          return [];
        }
      })(),
      status: room.status || 'available',
      size: room.size_sqm || room.size || 25,
      bed_type: room.bed_type || 'double',
      view_type: room.view_type || 'city'
    };
    
    console.log('\n📝 Simulated form data:');
    console.log(JSON.stringify(formData, null, 2));
    console.log('🔍 Form data types:', Object.keys(formData).map(key => `${key}: ${typeof formData[key]} = ${formData[key]}`));
    
    // Now simulate the frontend API updateRoom call (like in api.js)
    // Only send fields that exist in room_types table
    const mappedData = {
      // Only set hotel_id if it's provided, otherwise let backend handle it
      ...(formData.hotel_id && { hotel_id: formData.hotel_id }),
      name: formData.name,
      description: formData.description || '',
      price_per_night: parseFloat(formData.price) || 1500,
      max_guests: parseInt(formData.capacity) || 2,
      size_sqm: formData.size ? parseInt(formData.size) : null, // int to match schema
      type: formData.type || 'standard',
      amenities: Array.isArray(formData.amenities) ? formData.amenities : (formData.amenities ? [formData.amenities] : []),
      images: Array.isArray(formData.images) ? formData.images : []
      // Removed: bed_type (not in room_types schema)
    };
    
    console.log('\n🔧 API mapped data:');
    console.log(JSON.stringify(mappedData, null, 2));
    console.log('🔍 Mapped data types:', Object.keys(mappedData).map(key => `${key}: ${typeof mappedData[key]} = ${mappedData[key]}`));
    
    // Make the actual API call
    console.log('\n📡 Making API call...');
    const response = await api.put(`/admin/rooms/${room.id}`, mappedData);
    console.log('✅ Update successful:', response.data);
    
  } catch (error) {
    console.error('\n❌ Frontend simulation failed:');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request Data:', error.config?.data);
  }
}

simulateFrontendAPI();