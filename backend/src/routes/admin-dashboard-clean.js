import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware, requireStaff } from '../middleware/auth.js';

// Admin Dashboard API
export const adminDashboardRoutes = new Elysia()
  // Get simple dashboard stats for testing
  .get('/stats', async ({ headers, query, set }) => {
    try {
      console.log('🚀 Dashboard stats request received');
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });

      // Simple stats response for testing
      const simpleStats = {
        stats: {
          totalBookings: 15,
          pendingBookings: 3,
          confirmedBookings: 8,
          completedBookings: 4,
          cancelledBookings: 0,
          
          totalUsers: 25,
          newUsersThisMonth: 5,
          activeUsers: 20,
          staffUsers: 3,
          adminUsers: 2,
          
          totalRevenue: 85000,
          monthlyRevenue: 12000,
          revenueGrowth: 15,
          
          totalHotels: 3,
          totalRooms: 150,
          occupancyRate: 75,
          
          totalReviews: 42,
          averageRating: 4.2,
        },
        recentBookings: [
          {
            id: 1,
            guestName: "John Smith",
            guestEmail: "john@example.com",
            status: "confirmed",
            totalPrice: 2500,
            checkInDate: "2025-09-05",
            checkOutDate: "2025-09-07",
            createdAt: "2025-09-03T10:30:00Z",
            hotelName: "Royal Garden Hotel",
            hotelLocation: "Bangkok"
          }
        ],
        topHotels: [
          {
            id: 1,
            name: "Royal Garden Hotel",
            location: "Bangkok",
            totalRooms: 80,
            bookingCount: 12,
            revenue: 45000
          }
        ],
        bookingTrends: [
          {
            date: "2025-09-03",
            bookingCount: 3,
            revenue: 7500
          }
        ]
      };

      console.log('✅ Simple dashboard stats returned successfully');
      return simpleStats;

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })

  // Get revenue data for charts
  .get('/revenue', async ({ headers, query, set }) => {
    try {
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      const { days = 30 } = query;
      
      // Simple revenue data for testing
      const revenueData = {
        daily: [
          { date: '2025-09-01', revenue: 2500 },
          { date: '2025-09-02', revenue: 3200 },
          { date: '2025-09-03', revenue: 2800 }
        ],
        monthly: [
          { month: 'Aug 2025', revenue: 45000 },
          { month: 'Sep 2025', revenue: 52000 }
        ]
      };

      return revenueData;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Get user analytics
  .get('/users-analytics', async ({ headers, set }) => {
    try {
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      // Simple user analytics
      const userAnalytics = {
        registrations: [
          { date: '2025-09-01', count: 5 },
          { date: '2025-09-02', count: 8 },
          { date: '2025-09-03', count: 3 }
        ],
        activeUsers: 145,
        totalUsers: 250
      };

      return userAnalytics;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Get hotel performance
  .get('/hotels-performance', async ({ headers, set }) => {
    try {
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      // Simple hotel performance data
      const hotelPerformance = [
        {
          id: 1,
          name: 'Royal Garden Hotel',
          location: 'Bangkok',
          occupancyRate: 75,
          revenue: 45000,
          avgRating: 4.2
        },
        {
          id: 2,
          name: 'Seaside Resort',
          location: 'Phuket',
          occupancyRate: 82,
          revenue: 38000,
          avgRating: 4.5
        }
      ];

      return hotelPerformance;
    } catch (error) {
      console.error('Error fetching hotel performance:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
