# Email Notifications Setup

This document explains how to set up email notifications for order status updates in the Dashboard.

## Overview

When an admin changes an order status (processing, shipped, delivered, cancelled) in the dashboard, the system automatically sends an email notification to the customer using the email address from the shipping information.

## Backend Setup

The email functionality uses the backend API located in `Syria/backend`. Make sure:

1. **Backend server is running** on port 3001 (or configure `VITE_API_URL` in Dashboard)
2. **SMTP credentials are configured** in `Syria/backend/.env`:
   ```
   SMTP_HOST=mail.privateemail.com
   SMTP_PORT=587
   SMTP_USER=support@arvsouq.com
   SMTP_PASSWORD=your_password_here
   ```

## Dashboard Setup

1. **Set the API URL** (optional, defaults to `http://localhost:3001`):
   Create a `.env` file in the Dashboard folder:
   ```
   VITE_API_URL=http://localhost:3001
   ```
   Or set it to your production backend URL.

2. **Start the backend server**:
   ```bash
   cd Syria/backend
   npm run dev
   ```

3. **Start the dashboard**:
   ```bash
   cd Dashboard
   npm run dev
   ```

## How It Works

1. Admin opens an order in the Dashboard
2. Admin changes the order status (e.g., from "pending" to "shipped")
3. Dashboard updates the order status in the database
4. Dashboard calls the backend API to send an email notification
5. Backend sends a formatted email to the customer's shipping email address

## Email Templates

Different email templates are used based on the order status:

- **Processing**: "Your Order is Being Prepared" (blue theme)
- **Shipped**: "Your Order Has Shipped!" (yellow/orange theme)
- **Delivered**: "Your Order Has Been Delivered" (green theme)
- **Cancelled**: "Order Cancellation Notice" (red theme)

Each email includes:
- Order ID and date
- Current and previous status
- Order items with quantities and prices
- Order total
- Shipping address (for shipped status)
- Status-specific messaging

## Error Handling

- If email sending fails, the order status update still succeeds
- A warning message is shown to the admin if email notification fails
- Email errors are logged to the console for debugging

## Testing

To test the email notifications:

1. Ensure backend is running with valid SMTP credentials
2. Open an order in the Dashboard that has a shipping email address
3. Change the order status
4. Check the customer's email inbox for the notification

## Troubleshooting

- **Email not sending**: Check backend logs for SMTP errors
- **API connection failed**: Verify `VITE_API_URL` is correct and backend is running
- **CORS errors**: Ensure backend CORS configuration allows requests from Dashboard origin

