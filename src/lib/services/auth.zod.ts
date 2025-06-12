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

/**
 * Validation schema for POST /api/auth/password/reset request
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email must be less than 254 characters")
    .email("Invalid email format")
    .transform((email) => email.toLowerCase().trim()),
});

/**
 * Validation schema for POST /api/auth/password/update request
 */
export const passwordUpdateRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
});

// Export types inferred from schemas
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordUpdateRequest = z.infer<typeof passwordUpdateRequestSchema>;
