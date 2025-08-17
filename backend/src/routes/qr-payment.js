import { Elysia, t } from 'elysia';
import { generatePromptPayQR, generateTransactionRef, validatePromptPayId } from '../utils/qr-generator.js';

// Default payment settings
let paymentSettings = {
  promptpay: {
    id: "0610931494",
    name: "โรงแรม Hotel Bun Next",
    enabled: true
  },
  qrcode: {
    expiryMinutes: 30,
    showHotelName: true,
    showBookingDetails: true
  },
  ui: {
    showInstructions: true,
    showTimer: true,
    showSupportedApps: true
  }
};

export const qrPaymentRoutes = new Elysia({ prefix: '/api/qr-payment' })
  
  // Generate QR Code for payment
  .post('/generate-qr', async ({ body }) => {
    try {
      const { bookingId, amount, customerId } = body;
      
      if (!bookingId || !amount) {
        return { 
          error: 'Booking ID and amount are required',
          success: false 
        };
      }

      const ref1 = `BOOK${bookingId}`;
      const ref2 = `USER${customerId}${Date.now().toString().slice(-6)}`;

      const qrCodeImage = await generatePromptPayQR(
        paymentSettings.promptpay.id,
        amount,
        ref1,
        ref2
      );

      return {
        success: true,
        qrCodeImage,
        transactionRef: { ref1, ref2 },
        expiryMinutes: paymentSettings.qrcode.expiryMinutes,
        paymentInfo: {
          promptPayId: paymentSettings.promptpay.id,
          hotelName: paymentSettings.promptpay.name,
          amount: parseFloat(amount)
        }
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { error: 'Failed to generate QR code', success: false };
    }
  }, {
    body: t.Object({
      bookingId: t.String(),
      amount: t.Number(),
      customerId: t.Optional(t.String())
    })
  })

  // Verify QR payment with slip upload
  .post('/verify-qr-payment', async ({ body }) => {
    try {
      const { 
        bookingId, 
        amount, 
        paymentMethod, 
        transactionRef1, 
        transactionRef2, 
        paymentSlipBase64 
      } = body;

      if (!bookingId || !amount || !paymentSlipBase64) {
        return {
          error: 'Booking ID, amount, and payment slip are required',
          success: false
        };
      }

      // Save payment slip (in a real app, you'd save this to file system or cloud storage)
      const paymentRecord = {
        id: Date.now(),
        bookingId,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'promptpay_qr',
        transactionRef1,
        transactionRef2,
        paymentSlipBase64,
        status: 'pending_verification',
        createdAt: new Date(),
        promptPayId: paymentSettings.promptpay.id
      };

      // TODO: Save to database
      console.log('Payment record:', {
        ...paymentRecord,
        paymentSlipBase64: 'base64_data_truncated'
      });

      return {
        success: true,
        message: 'Payment submitted successfully. Awaiting verification.',
        paymentId: paymentRecord.id,
        status: 'pending_verification'
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { error: 'Failed to verify payment', success: false };
    }
  }, {
    body: t.Object({
      bookingId: t.String(),
      amount: t.Number(),
      paymentMethod: t.Optional(t.String()),
      transactionRef1: t.Optional(t.String()),
      transactionRef2: t.Optional(t.String()),
      paymentSlipBase64: t.String()
    })
  })

  // Get payment settings
  .get('/payment-settings', () => {
    return {
      success: true,
      settings: paymentSettings
    };
  })

  // Update payment settings (Admin only)
  .put('/payment-settings', async ({ body }) => {
    try {
      const { settings } = body;
      
      // Validate settings
      if (!settings.promptpay.id || !settings.promptpay.name) {
        return {
          error: 'PromptPay ID and hotel name are required',
          success: false
        };
      }

      // Validate PromptPay ID format
      const validation = validatePromptPayId(settings.promptpay.id);
      if (!validation.isValid) {
        return {
          error: 'Invalid PromptPay ID format',
          success: false
        };
      }

      paymentSettings = { ...paymentSettings, ...settings };
      
      // TODO: Save to database
      console.log('Updated payment settings:', paymentSettings);

      return {
        success: true,
        message: 'Payment settings updated successfully',
        settings: paymentSettings
      };
    } catch (error) {
      console.error('Error updating payment settings:', error);
      return { error: 'Failed to update payment settings', success: false };
    }
  }, {
    body: t.Object({
      settings: t.Object({
        promptpay: t.Object({
          id: t.String(),
          name: t.String(),
          enabled: t.Boolean()
        }),
        qrcode: t.Object({
          expiryMinutes: t.Number(),
          showHotelName: t.Boolean(),
          showBookingDetails: t.Boolean()
        }),
        ui: t.Object({
          showInstructions: t.Boolean(),
          showTimer: t.Boolean(),
          showSupportedApps: t.Boolean()
        })
      })
    })
  })

  // Test QR generation (Admin only)
  .post('/test-qr-generation', async ({ body }) => {
    try {
      const { promptPayId, amount, testBookingId } = body;
      
      const qrCodeImage = await generatePromptPayQR(
        promptPayId || paymentSettings.promptpay.id,
        amount || 100,
        `TEST${testBookingId}`,
        `DEMO${Date.now().toString().slice(-6)}`
      );

      return {
        success: true,
        qrCodeImage,
        message: 'Test QR code generated successfully'
      };
    } catch (error) {
      console.error('Error generating test QR:', error);
      return { error: 'Failed to generate test QR code', success: false };
    }
  }, {
    body: t.Object({
      promptPayId: t.Optional(t.String()),
      amount: t.Optional(t.Number()),
      testBookingId: t.Optional(t.String())
    })
  })

  // Get payment history (Admin only)
  .get('/payment-history', async () => {
    try {
      // TODO: Fetch from database
      const mockPayments = [
        {
          id: 1,
          bookingId: 'BOOK001',
          amount: 2500.00,
          status: 'verified',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          paymentMethod: 'promptpay_qr'
        },
        {
          id: 2,
          bookingId: 'BOOK002',
          amount: 3200.00,
          status: 'pending_verification',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          paymentMethod: 'promptpay_qr'
        }
      ];

      return {
        success: true,
        payments: mockPayments
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { error: 'Failed to fetch payment history', success: false };
    }
  });
