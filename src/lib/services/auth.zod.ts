import { z } from "zod";

/**
 * Validation schema for POST /api/auth/login request
 * Validates email format and password requirements
 */
export const loginRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email must be less than 254 characters")
    .email("Invalid email format")
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
});

/**
 * Validation schema for POST /api/auth/refresh request
 */
export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

/**
 * Validation schema for POST /api/auth/register request
 */
export const registerRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email must be less than 254 characters")
    .email("Invalid email format")
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),

  age_confirmation: z.boolean().refine((val) => val === true, "Age confirmation is required"),
});

// Export types inferred from schemas
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
