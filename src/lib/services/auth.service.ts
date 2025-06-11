import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { LoginRequestDTO, LoginResponseDTO, UserProfile } from "@/types";
import { loginRequestSchema } from "./auth.zod";

/**
 * Service for handling user authentication operations
 * Includes login, logout, token management, and user profile operations
 */
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Authenticate user with email and password
   * @param request - Login credentials
   * @returns Auth tokens and user profile
   */
  async login(request: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Validate input data
    const validated = loginRequestSchema.parse(request);

    // Attempt authentication with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      this.handleAuthError(error);
    }

    if (!data.user || !data.session) {
      throw new Error("Authentication failed: Invalid response from auth service");
    }

    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      throw new Error("Email not confirmed");
    }

    // Update last sign in timestamp
    await this.updateLastSignIn(data.user.id);

    // Format user profile
    const userProfile = this.formatUserProfile(data.user);

    // Return formatted response
    return {
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        user: userProfile,
      },
    };
  }

  /**
   * Update user's last sign in timestamp
   */
  private async updateLastSignIn(_userId: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      data: { last_sign_in_at: new Date().toISOString() },
    });

    if (error) {
      // Log error but don't fail the login process
      // TODO: Replace with proper logging service
      // console.error("Failed to update last_sign_in_at:", error);
    }
  }

  /**
   * Format Supabase user data to UserProfile interface
   */
  private formatUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };
  }

  /**
   * Handle Supabase auth errors and throw appropriate application errors
   */
  private handleAuthError(error: any): never {
    const message = error.message?.toLowerCase() || "";

    // Invalid credentials
    if (
      message.includes("invalid login credentials") ||
      message.includes("invalid email or password") ||
      error.status === 400
    ) {
      throw new Error("Invalid credentials");
    }

    // Email not confirmed
    if (message.includes("email not confirmed") || message.includes("signup not allowed") || error.status === 422) {
      throw new Error("Email not confirmed");
    }

    // Too many requests
    if (message.includes("too many requests") || error.status === 429) {
      throw new Error("Too many requests");
    }

    // Generic server error
    console.error("Supabase auth error:", error);
    throw new Error("Authentication service temporarily unavailable");
  }

  /**
   * Validate user session and get user profile
   * @param token - JWT access token
   * @returns User profile or null if invalid
   */
  async validateSession(token: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      return this.formatUserProfile(data.user);
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  /**
   * Logout user and invalidate session
   * @param token - JWT access token
   */
  async logout(token: string): Promise<void> {
    try {
      // Set the session for the logout operation
      await this.supabase.auth.setSession({
        access_token: token,
        refresh_token: "", // We might not have the refresh token here
      });

      // Sign out the user
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        // Don't throw error for logout - it might already be invalid
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Don't throw error for logout operations
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New access token and expiration
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new Error("Invalid refresh token");
      }

      return {
        access_token: data.session.access_token,
        expires_in: data.session.expires_in || 3600,
      };
    } catch (_error) {
      // TODO: Replace with proper logging service
      // console.error("Token refresh error:", error);
      throw new Error("Invalid refresh token");
    }
  }
}
