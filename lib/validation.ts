import { z } from 'zod'

// Contact form validation
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
})

// Valuation request validation
export const valuationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  truckManufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  truckModel: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  kilometers: z.number().int().min(0).max(10000000),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor'], {
    message: 'Condition must be Excellent, Good, Fair, or Poor',
  }),
  additionalInfo: z.string().max(1000).optional().nullable(),
})

// Truck inquiry validation
export const inquirySchema = z.object({
  truckId: z.number().int().positive('Truck ID must be a positive number'),
  truckName: z.string().min(1, 'Truck name is required').max(200),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  message: z.string().max(1000).optional().nullable(),
})

// Truck submission validation
export const truckSubmissionSchema = z.object({
  // Seller Information
  sellerName: z.string().min(2, 'Seller name must be at least 2 characters').max(100),
  sellerEmail: z.string().email('Invalid email address'),
  sellerPhone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  
  // Truck Basic Information
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().max(50).optional().nullable(),
  
  // Truck Specifications
  kilometers: z.number().int().min(0).max(10000000),
  fuelType: z.enum(['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid'], {
    message: 'Fuel type must be Diesel, Petrol, CNG, Electric, or Hybrid',
  }),
  transmission: z.enum(['Manual', 'Automatic', 'AMT'], {
    message: 'Transmission must be Manual, Automatic, or AMT',
  }),
  horsepower: z.number().int().min(0).max(10000).optional().nullable(),
  engineCapacity: z.string().max(20).optional().nullable(),
  
  // Condition & Ownership
  condition: z.enum(['Excellent', 'Good', 'Fair'], {
    message: 'Condition must be Excellent, Good, or Fair',
  }),
  ownerNumber: z.number().int().min(1).max(10),
  
  // Pricing (5-8 lacs range)
  askingPrice: z.number()
    .min(500000, 'Asking price must be at least 5 lacs (₹5,00,000)')
    .max(800000, 'Asking price must not exceed 8 lacs (₹8,00,000)'),
  negotiable: z.boolean().default(true),
  
  // Location
  location: z.string().min(1, 'Location is required').max(200),
  state: z.string().min(1, 'State is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  
  // Additional Details
  features: z.string().optional().nullable(), // JSON string
  description: z.string().max(5000).optional().nullable(),
  
  // Images
  images: z.string().min(1, 'At least one image is required'), // JSON string
})

// Truck creation validation (for admin)
export const truckCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  kilometers: z.number().int().min(0).max(10000000),
  horsepower: z.number().int().min(0).max(10000),
  price: z.number()
    .min(500000, 'Price must be at least 5 lacs (₹5,00,000)')
    .max(800000, 'Price must not exceed 8 lacs (₹8,00,000)'),
  imageUrl: z.string().url('Invalid image URL'),
  subtitle: z.string().max(200).optional().nullable(),
  certified: z.boolean().default(true),
})

// Search query validation
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // Browse page requests 500; must allow or validation fails and API falls back to 20
  limit: z.coerce.number().int().min(1).max(500).default(20),
})

/** For /api/trucks: browse page may request a high limit to list the full certified inventory. */
export const trucksListPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

// OTP request validation
export const otpRequestSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  purpose: z.enum(['inquiry', 'booking', 'test_drive', 'report_view'], {
    message: 'Purpose must be inquiry, booking, test_drive, or report_view',
  }),
})

// OTP verification validation
export const otpVerifySchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
  purpose: z.enum(['inquiry', 'booking', 'test_drive', 'report_view'], {
    message: 'Purpose must be inquiry, booking, test_drive, or report_view',
  }),
})

// Updated inquiry schema with OTP verification token
export const inquiryWithOTPSchema = z.object({
  truckId: z.number().int().positive('Truck ID must be a positive number'),
  truckName: z.string().min(1, 'Truck name is required').max(200),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  message: z.string().max(1000).optional().nullable(),
  otpToken: z.string().min(1, 'OTP verification token is required'), // Token from OTP verification
})

// Type exports
export type ContactInput = z.infer<typeof contactSchema>
export type ValuationInput = z.infer<typeof valuationSchema>
export type InquiryInput = z.infer<typeof inquirySchema>
export type InquiryWithOTPInput = z.infer<typeof inquiryWithOTPSchema>
export type TruckSubmissionInput = z.infer<typeof truckSubmissionSchema>
export type TruckCreateInput = z.infer<typeof truckCreateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type OTPRequestInput = z.infer<typeof otpRequestSchema>
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>

