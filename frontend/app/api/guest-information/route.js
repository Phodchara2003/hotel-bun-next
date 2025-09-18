// API Route for Guest Information Management
// Handle guest information submission and retrieval

import { NextRequest, NextResponse } from 'next/server';
import { createGuestInformation, getAllGuests, getGuestById, getGuestByReference, updateGuestInformation, processCheckIn, getGuestStatistics } from '../../../../guest-information.cjs';

export async function POST(request) {
  try {
    console.log('📝 Guest Information API - POST request received');
    
    const guestData = await request.json();
    console.log('Received guest data:', guestData);
    
    // Validate required fields
    const requiredFields = [
      'bookingReference',
      'primaryGuest.firstName',
      'primaryGuest.lastName',
      'primaryGuest.email',
      'primaryGuest.phone',
      'primaryGuest.idNumber',
      'bookingDetails.hotelId',
      'bookingDetails.hotelName',
      'paymentInfo.paymentSlipPath'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const keys = field.split('.');
      let value = guestData;
      for (const key of keys) {
        value = value?.[key];
      }
      return !value;
    });
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      }, { status: 400 });
    }
    
    // Create guest information
    const result = createGuestInformation(guestData);
    
    if (result.success) {
      console.log('✅ Guest information created successfully:', result.guest.guestReference);
      
      return NextResponse.json({
        success: true,
        guest: {
          id: result.guest.id,
          guestReference: result.guest.guestReference,
          primaryGuest: {
            firstName: result.guest.primaryGuest.firstName,
            lastName: result.guest.primaryGuest.lastName,
            email: result.guest.primaryGuest.email
          },
          bookingDetails: result.guest.bookingDetails,
          checkInStatus: result.guest.checkInStatus
        },
        message: 'Guest information saved successfully'
      }, { status: 201 });
    } else {
      console.log('❌ Failed to create guest information:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Guest Information API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    console.log('📋 Guest Information API - GET request received');
    
    const { searchParams } = new URL(request.url);
    
    // Get specific guest by ID or reference
    const guestId = searchParams.get('id');
    const guestReference = searchParams.get('ref');
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      // Get guest statistics for admin dashboard
      console.log('📊 Getting guest statistics...');
      const stats = getGuestStatistics();
      
      if (stats) {
        return NextResponse.json({
          success: true,
          statistics: stats
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to get statistics'
        }, { status: 500 });
      }
    }
    
    if (guestId) {
      console.log(`👤 Getting guest by ID: ${guestId}`);
      const guest = getGuestById(parseInt(guestId));
      
      if (guest) {
        // Remove sensitive information for client response
        const safeGuest = {
          id: guest.id,
          guestReference: guest.guestReference,
          bookingReference: guest.bookingReference,
          primaryGuest: {
            title: guest.primaryGuest.title,
            firstName: guest.primaryGuest.firstName,
            lastName: guest.primaryGuest.lastName,
            email: guest.primaryGuest.email,
            phone: guest.primaryGuest.phone,
            nationality: guest.primaryGuest.nationality
          },
          additionalGuests: guest.additionalGuests?.map(ag => ({
            title: ag.title,
            firstName: ag.firstName,
            lastName: ag.lastName,
            relationship: ag.relationship
          })) || [],
          bookingDetails: guest.bookingDetails,
          specialRequests: guest.specialRequests,
          checkInStatus: guest.checkInStatus,
          checkInTime: guest.checkInTime,
          checkOutTime: guest.checkOutTime,
          status: guest.status,
          createdAt: guest.createdAt
        };
        
        return NextResponse.json({
          success: true,
          guest: safeGuest
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Guest not found'
        }, { status: 404 });
      }
    }
    
    if (guestReference) {
      console.log(`🔍 Getting guest by reference: ${guestReference}`);
      const guest = getGuestByReference(guestReference);
      
      if (guest) {
        // Remove sensitive information for client response
        const safeGuest = {
          id: guest.id,
          guestReference: guest.guestReference,
          bookingReference: guest.bookingReference,
          primaryGuest: {
            title: guest.primaryGuest.title,
            firstName: guest.primaryGuest.firstName,
            lastName: guest.primaryGuest.lastName,
            email: guest.primaryGuest.email,
            phone: guest.primaryGuest.phone,
            nationality: guest.primaryGuest.nationality
          },
          additionalGuests: guest.additionalGuests?.map(ag => ({
            title: ag.title,
            firstName: ag.firstName,
            lastName: ag.lastName,
            relationship: ag.relationship
          })) || [],
          bookingDetails: guest.bookingDetails,
          specialRequests: guest.specialRequests,
          checkInStatus: guest.checkInStatus,
          checkInTime: guest.checkInTime,
          checkOutTime: guest.checkOutTime,
          status: guest.status,
          createdAt: guest.createdAt
        };
        
        return NextResponse.json({
          success: true,
          guest: safeGuest
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Guest not found'
        }, { status: 404 });
      }
    }
    
    // Get all guests with filters
    const filters = {
      status: searchParams.get('status'),
      checkInStatus: searchParams.get('checkInStatus'),
      hotelId: searchParams.get('hotelId') ? parseInt(searchParams.get('hotelId')) : undefined,
      checkInDate: searchParams.get('checkInDate'),
      paymentStatus: searchParams.get('paymentStatus')
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    console.log('📋 Getting all guests with filters:', filters);
    const guests = getAllGuests(filters);
    
    // Remove sensitive information for client response
    const safeGuests = guests.map(guest => ({
      id: guest.id,
      guestReference: guest.guestReference,
      bookingReference: guest.bookingReference,
      primaryGuest: {
        title: guest.primaryGuest.title,
        firstName: guest.primaryGuest.firstName,
        lastName: guest.primaryGuest.lastName,
        email: guest.primaryGuest.email,
        phone: guest.primaryGuest.phone,
        nationality: guest.primaryGuest.nationality
      },
      additionalGuests: guest.additionalGuests?.map(ag => ({
        title: ag.title,
        firstName: ag.firstName,
        lastName: ag.lastName,
        relationship: ag.relationship
      })) || [],
      bookingDetails: guest.bookingDetails,
      specialRequests: guest.specialRequests,
      paymentInfo: {
        paymentStatus: guest.paymentInfo.paymentStatus,
        paymentMethod: guest.paymentInfo.paymentMethod,
        paymentAmount: guest.paymentInfo.paymentAmount,
        paymentDate: guest.paymentInfo.paymentDate
      },
      checkInStatus: guest.checkInStatus,
      checkInTime: guest.checkInTime,
      checkOutTime: guest.checkOutTime,
      status: guest.status,
      createdAt: guest.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      guests: safeGuests,
      count: safeGuests.length,
      filters: filters
    });
    
  } catch (error) {
    console.error('❌ Guest Information API GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    console.log('📝 Guest Information API - PUT request received');
    
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!guestId) {
      return NextResponse.json({
        success: false,
        error: 'Guest ID is required'
      }, { status: 400 });
    }
    
    const updateData = await request.json();
    console.log('Update data:', updateData);
    
    if (action === 'checkin') {
      // Process check-in
      console.log(`🏨 Processing check-in for guest ${guestId}...`);
      const result = processCheckIn(parseInt(guestId), updateData);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          checkin: result.checkin,
          guest: {
            id: result.guest.id,
            guestReference: result.guest.guestReference,
            checkInStatus: result.guest.checkInStatus,
            checkInTime: result.guest.checkInTime
          },
          message: 'Check-in processed successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
      }
    } else {
      // Update guest information
      console.log(`📝 Updating guest ${guestId}...`);
      const result = updateGuestInformation(parseInt(guestId), updateData);
      
      if (result.success) {
        // Remove sensitive information for client response
        const safeGuest = {
          id: result.guest.id,
          guestReference: result.guest.guestReference,
          bookingReference: result.guest.bookingReference,
          primaryGuest: {
            title: result.guest.primaryGuest.title,
            firstName: result.guest.primaryGuest.firstName,
            lastName: result.guest.primaryGuest.lastName,
            email: result.guest.primaryGuest.email,
            phone: result.guest.primaryGuest.phone,
            nationality: result.guest.primaryGuest.nationality
          },
          checkInStatus: result.guest.checkInStatus,
          status: result.guest.status,
          updatedAt: result.guest.updatedAt
        };
        
        return NextResponse.json({
          success: true,
          guest: safeGuest,
          message: 'Guest information updated successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
      }
    }
    
  } catch (error) {
    console.error('❌ Guest Information API PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}