/**
 * Email service for sending order status update notifications
 * This service calls the backend API to send emails using SMTP
 */

import { getApiUrl } from './utils';

const API_BASE_URL = getApiUrl();

interface SendOrderStatusUpdateEmailParams {
  orderId: string;
  newStatus: string;
  oldStatus?: string;
}

/**
 * Send order status update email notification
 * @param params - Order ID, new status, and optional old status
 * @returns Promise that resolves when email is sent successfully
 */
export async function sendOrderStatusUpdateEmail({
  orderId,
  newStatus,
  oldStatus,
}: SendOrderStatusUpdateEmailParams): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status-update-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newStatus,
        oldStatus,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Order status update email sent successfully:', data);
  } catch (error) {
    console.error('Error sending order status update email:', error);
    throw error;
  }
}

