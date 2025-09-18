// Guest Information Management Module
// Handles guest data persistence and retrieval

const fs = require('fs');
const path = require('path');

// File path for guest information storage
const GUEST_INFO_FILE = path.join(__dirname, 'guest_information.json');

// Ensure the guest information file exists
function ensureGuestInfoFile() {
  if (!fs.existsSync(GUEST_INFO_FILE)) {
    fs.writeFileSync(GUEST_INFO_FILE, JSON.stringify([], null, 2));
  }
}

// Load guest information from file
function loadGuestInformation() {
  try {
    ensureGuestInfoFile();
    const data = fs.readFileSync(GUEST_INFO_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading guest information:', error);
    return [];
  }
}

// Save guest information to file
function saveGuestInformation(guests) {
  try {
    fs.writeFileSync(GUEST_INFO_FILE, JSON.stringify(guests, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving guest information:', error);
    return false;
  }
}

// Generate unique reference ID
function generateReferenceId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `REF${timestamp}${random}`;
}

// Create new guest information
function createGuestInformation(guestData) {
  try {
    const guests = loadGuestInformation();
    const newGuest = {
      id: Date.now(),
      referenceId: generateReferenceId(),
      ...guestData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    guests.push(newGuest);
    const saved = saveGuestInformation(guests);
    
    if (saved) {
      return { success: true, data: newGuest };
    } else {
      return { success: false, message: 'Failed to save guest information' };
    }
  } catch (error) {
    console.error('Error creating guest information:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Get all guests
function getAllGuests() {
  try {
    const guests = loadGuestInformation();
    return { success: true, data: guests };
  } catch (error) {
    console.error('Error getting all guests:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Get guest by ID
function getGuestById(id) {
  try {
    const guests = loadGuestInformation();
    const guest = guests.find(g => g.id === parseInt(id));
    
    if (guest) {
      return { success: true, data: guest };
    } else {
      return { success: false, message: 'Guest not found' };
    }
  } catch (error) {
    console.error('Error getting guest by ID:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Get guest by reference ID
function getGuestByReference(referenceId) {
  try {
    const guests = loadGuestInformation();
    const guest = guests.find(g => g.referenceId === referenceId);
    
    if (guest) {
      return { success: true, data: guest };
    } else {
      return { success: false, message: 'Guest not found' };
    }
  } catch (error) {
    console.error('Error getting guest by reference:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Update guest information
function updateGuestInformation(id, updateData) {
  try {
    const guests = loadGuestInformation();
    const guestIndex = guests.findIndex(g => g.id === parseInt(id));
    
    if (guestIndex !== -1) {
      guests[guestIndex] = {
        ...guests[guestIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const saved = saveGuestInformation(guests);
      
      if (saved) {
        return { success: true, data: guests[guestIndex] };
      } else {
        return { success: false, message: 'Failed to update guest information' };
      }
    } else {
      return { success: false, message: 'Guest not found' };
    }
  } catch (error) {
    console.error('Error updating guest information:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Process check-in
function processCheckIn(referenceId) {
  try {
    const guests = loadGuestInformation();
    const guestIndex = guests.findIndex(g => g.referenceId === referenceId);
    
    if (guestIndex !== -1) {
      guests[guestIndex].status = 'checked-in';
      guests[guestIndex].checkInTime = new Date().toISOString();
      guests[guestIndex].updatedAt = new Date().toISOString();
      
      const saved = saveGuestInformation(guests);
      
      if (saved) {
        return { success: true, data: guests[guestIndex] };
      } else {
        return { success: false, message: 'Failed to process check-in' };
      }
    } else {
      return { success: false, message: 'Guest not found' };
    }
  } catch (error) {
    console.error('Error processing check-in:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Get guest statistics
function getGuestStatistics() {
  try {
    const guests = loadGuestInformation();
    const stats = {
      total: guests.length,
      pending: guests.filter(g => g.status === 'pending').length,
      checkedIn: guests.filter(g => g.status === 'checked-in').length,
      checkedOut: guests.filter(g => g.status === 'checked-out').length
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting guest statistics:', error);
    return { success: false, message: 'Internal server error' };
  }
}

module.exports = {
  createGuestInformation,
  getAllGuests,
  getGuestById,
  getGuestByReference,
  updateGuestInformation,
  processCheckIn,
  getGuestStatistics
};