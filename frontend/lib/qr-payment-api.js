// QR Code Payment API functions
import { generatePromptPayQR, generateTransactionRef } from '@/lib/qrcode-generator';

const API_BASE_URL = 'http://localhost:3001/api/qr-payment';

/**
 * Generate QR Code for payment
 */
export const generatePaymentQR = async (bookingId, amount, customerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        amount,
        customerId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating payment QR:', error);
    throw error;
  }
};

/**
 * Verify payment with slip upload
 */
export const verifyPayment = async (paymentData) => {
  try {
    // Convert file to base64
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    };

    const paymentSlipBase64 = paymentData.paymentSlip 
      ? await fileToBase64(paymentData.paymentSlip)
      : null;

    const response = await fetch(`${API_BASE_URL}/verify-qr-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...paymentData,
        paymentSlipBase64
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Get payment settings
 */
export const getPaymentSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-settings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw error;
  }
};

/**
 * Update payment settings (Admin only)
 */
export const updatePaymentSettings = async (settings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      throw new Error('Failed to update payment settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating payment settings:', error);
    throw error;
  }
};

/**
 * Test QR generation (Admin only)
 */
export const testQRGeneration = async (testData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-qr-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error('Failed to test QR generation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error testing QR generation:', error);
    throw error;
  }
};

/**
 * Get payment history (Admin only)
 */
export const getPaymentHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-history`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};
