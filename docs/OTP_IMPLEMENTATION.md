# OTP/SMS Implementation Guide

## Overview

This project now includes OTP (One-Time Password) verification via SMS for truck bookings and inquiries. Users must verify their phone number before submitting a truck inquiry or booking.

## Features

- ✅ OTP generation and SMS delivery via Twilio
- ✅ Secure OTP hashing and verification
- ✅ Rate limiting (max attempts, expiry time)
- ✅ OTP verification token system
- ✅ Integration with truck inquiry API

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration (Required for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OTP Configuration (Optional - has defaults)
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
OTP_MAX_ATTEMPTS=5
```

### 2. Get Twilio Credentials

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the console
3. Get a phone number (trial account works for testing)
4. Add credentials to `.env`

### 3. Database Migration

The OTP model has been added to the database. If you haven't run migrations:

```bash
npx prisma migrate dev
```

## API Endpoints

### 1. Send OTP

**Endpoint:** `POST /api/otp/send`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "purpose": "inquiry" // or "booking", "test_drive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": "10 minutes"
  },
  "message": "OTP has been sent to your phone number"
}
```

**Rate Limiting:**
- Can't request new OTP within 1 minute of previous request
- Prevents SMS spam

### 2. Verify OTP

**Endpoint:** `POST /api/otp/verify`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "purpose": "inquiry"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "token": "verification_token_here",
    "expiresAt": "2024-12-01T10:15:00.000Z",
    "purpose": "inquiry"
  },
  "message": "OTP verified successfully"
}
```

**Error Cases:**
- Invalid OTP: Returns 400 with remaining attempts
- Expired OTP: Returns 400
- Max attempts exceeded: Returns 429

### 3. Submit Truck Inquiry (Updated)

**Endpoint:** `POST /api/inquiries`

**Request Body:**
```json
{
  "truckId": 1,
  "truckName": "Tata Ultra 1418",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in this truck",
  "otpToken": "verification_token_from_otp_verify"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "truckId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "inquiredAt": "2024-12-01T10:20:00.000Z"
  },
  "message": "Inquiry submitted successfully. Your phone number has been verified."
}
```

**Error Cases:**
- Missing or invalid OTP token: Returns 401
- OTP token expired: Returns 401

## Frontend Integration Flow

### Step 1: User enters phone number
```typescript
// Request OTP
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: userPhone,
    purpose: 'inquiry'
  })
})
```

### Step 2: User enters OTP
```typescript
// Verify OTP
const verifyResponse = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: userPhone,
    otp: userEnteredOTP,
    purpose: 'inquiry'
  })
})

const { token } = await verifyResponse.json()
```

### Step 3: Submit inquiry with token
```typescript
// Submit inquiry
const inquiryResponse = await fetch('/api/inquiries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    truckId: 1,
    truckName: "Tata Ultra 1418",
    name: "John Doe",
    email: "john@example.com",
    phone: userPhone,
    message: "Interested",
    otpToken: token // Use token from step 2
  })
})
```

## Security Features

1. **OTP Hashing**: OTPs are hashed using SHA-256 before storage
2. **Expiry**: OTPs expire after 10 minutes (configurable)
3. **Max Attempts**: Maximum 5 verification attempts (configurable)
4. **Rate Limiting**: Can't request new OTP within 1 minute
5. **Token Expiry**: Verification tokens expire after 15 minutes
6. **Secure Verification**: Uses timing-safe comparison for OTP verification

## Development Mode

In development mode (when Twilio is not configured), OTPs are logged to the console instead of being sent via SMS:

```
📱 OTP for +1234567890: 123456 (Purpose: inquiry)
```

This allows testing without Twilio credentials.

## Database Schema

The `OtpVerification` model stores:

- `phone`: User's phone number
- `otp`: Hashed OTP (SHA-256)
- `purpose`: Purpose of OTP (inquiry, booking, test_drive)
- `verified`: Whether OTP has been verified
- `attempts`: Number of verification attempts
- `maxAttempts`: Maximum allowed attempts
- `expiresAt`: OTP expiration time
- `verifiedAt`: When OTP was verified

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `OTP_EXPIRY_MINUTES` | 10 | OTP expiration time in minutes |
| `OTP_LENGTH` | 6 | Length of OTP code |
| `OTP_MAX_ATTEMPTS` | 5 | Maximum verification attempts |

## Troubleshooting

### OTP not being sent
- Check Twilio credentials in `.env`
- Verify phone number format (should start with +)
- Check Twilio account balance
- In development, check console logs

### OTP verification failing
- Ensure OTP hasn't expired (10 minutes)
- Check if max attempts exceeded
- Verify phone number matches exactly

### Database errors
- Run migrations: `npx prisma migrate dev`
- Check database connection in `.env`

## Next Steps

To extend this to other purposes (test drive, booking):

1. Use `purpose: "test_drive"` or `purpose: "booking"` when sending OTP
2. Update the respective API endpoints to require OTP verification
3. Use the same verification flow

## Support

For issues or questions:
- Check Twilio documentation: https://www.twilio.com/docs
- Review API error messages in responses
- Check server logs for detailed error information

