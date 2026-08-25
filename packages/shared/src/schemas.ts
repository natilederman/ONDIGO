import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  vehicleType: z.enum(['car', 'truck', 'bike', 'scooter']).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const profileEditSchema = z.object({
  fullName: z.string().min(2),
  bio: z.string().max(500).optional(),
  vehicleType: z.enum(['car', 'truck', 'bike', 'scooter']).optional(),
});

export const postTripSchema = z.object({
  originText: z.string().min(2),
  originLat: z.number(),
  originLng: z.number(),
  destinationText: z.string().min(2),
  destinationLat: z.number(),
  destinationLng: z.number(),
  departAt: z.string().min(1, 'Pick a date/time'),
  vehicleType: z.enum(['car', 'truck', 'bike', 'scooter']),
  capacityWeightKg: z.number().positive(),
  capacitySize: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const postRequestSchema = z
  .object({
    itemDescription: z.string().min(3),
    itemSize: z.string().min(1),
    itemWeightKg: z.number().positive(),
    pickupText: z.string().min(2),
    pickupLat: z.number(),
    pickupLng: z.number(),
    dropoffText: z.string().min(2),
    dropoffLat: z.number(),
    dropoffLng: z.number(),
    neededBy: z.string().min(1),
    pricingMode: z.enum(['fixed', 'auction']),
    fixedPrice: z.number().positive().optional(),
    startingPrice: z.number().positive().optional(),
    biddingEndsAt: z.string().optional(),
    extendOnBid: z.boolean().default(false),
    extendSeconds: z.number().int().positive().default(60),
    legalDeclarationAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the legal declaration' }),
    }),
  })
  .refine((v) => (v.pricingMode === 'fixed' ? v.fixedPrice != null : true), {
    message: 'Fixed price is required',
    path: ['fixedPrice'],
  })
  .refine((v) => (v.pricingMode === 'auction' ? v.startingPrice != null && v.biddingEndsAt : true), {
    message: 'Starting price and bidding end time are required',
    path: ['startingPrice'],
  });

export const placeBidSchema = z.object({
  requestId: z.string().uuid(),
  amount: z.number().positive(),
});

export const reviewSchema = z.object({
  deliveryId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const messageSchema = z.object({
  deliveryId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});
