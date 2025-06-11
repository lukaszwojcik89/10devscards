import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "./auth.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { LoginRequestDTO } from "@/types";

// Mock supabase client
const mockAuth = {
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  setSession: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
  updateUser: vi.fn(),
};

const mockSupabase = {
  auth: mockAuth,
} as unknown as SupabaseClient<Database>;

describe("AuthService.login", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockSupabase);
    vi.clearAllMocks();
  });

  it("should login successfully with valid credentials", async () => {
    // Arrange
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "2025-06-10T10:00:00Z",
      created_at: "2025-06-10T10:00:00Z",
      last_sign_in_at: "2025-06-11T10:00:00Z",
    };

    const mockSession = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
    };

    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    mockAuth.updateUser.mockResolvedValue({ error: null });

    const request: LoginRequestDTO = {
      email: "test@example.com",
      password: "password123",
    };

    // Act
    const result = await service.login(request);

    // Assert
    expect(result).toEqual({
      data: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        user: {
          id: "user-123",
          email: "test@example.com",
          email_confirmed_at: "2025-06-10T10:00:00Z",
          created_at: "2025-06-10T10:00:00Z",
          last_sign_in_at: "2025-06-11T10:00:00Z",
        },
      },
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockAuth.updateUser).toHaveBeenCalledWith({
      data: { last_sign_in_at: expect.any(String) },
    });
  });

  it("should throw error for invalid credentials", async () => {
    // Arrange
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", status: 400 },
    });

    const request: LoginRequestDTO = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    // Act & Assert
    await expect(service.login(request)).rejects.toThrow("Invalid credentials");
  });

  it("should throw error for unconfirmed email", async () => {
    // Arrange
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: null, // Not confirmed
      created_at: "2025-06-10T10:00:00Z",
    };

    const mockSession = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
    };

    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const request: LoginRequestDTO = {
      email: "test@example.com",
      password: "password123",
    };

    // Act & Assert
    await expect(service.login(request)).rejects.toThrow("Email not confirmed");
  });

  it("should validate email format", async () => {
    // Arrange
    const request: LoginRequestDTO = {
      email: "invalid-email",
      password: "password123",
    };

    // Act & Assert
    await expect(service.login(request)).rejects.toThrow("Invalid email format");
  });

  it("should validate password length", async () => {
    // Arrange
    const request: LoginRequestDTO = {
      email: "test@example.com",
      password: "short",
    };

    // Act & Assert
    await expect(service.login(request)).rejects.toThrow("Password must be at least 8 characters");
  });

  it("should handle too many requests error", async () => {
    // Arrange
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Too many requests", status: 429 },
    });

    const request: LoginRequestDTO = {
      email: "test@example.com",
      password: "password123",
    };

    // Act & Assert
    await expect(service.login(request)).rejects.toThrow("Too many requests");
  });

  it("should normalize email to lowercase", async () => {
    // Arrange
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "2025-06-10T10:00:00Z",
      created_at: "2025-06-10T10:00:00Z",
    };

    const mockSession = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
    };

    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    mockAuth.updateUser.mockResolvedValue({ error: null });

    const request: LoginRequestDTO = {
      email: "TEST@EXAMPLE.COM", // Uppercase email
      password: "password123",
    };

    // Act
    await service.login(request);

    // Assert - should call with lowercase email
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});

describe("AuthService.validateSession", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockSupabase);
    vi.clearAllMocks();
  });

  it("should validate valid session", async () => {
    // Arrange
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "2025-06-10T10:00:00Z",
      created_at: "2025-06-10T10:00:00Z",
    };

    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Act
    const result = await service.validateSession("valid-token");

    // Assert
    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "2025-06-10T10:00:00Z",
      created_at: "2025-06-10T10:00:00Z",
      last_sign_in_at: undefined,
    });
  });

  it("should return null for invalid session", async () => {
    // Arrange
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    // Act
    const result = await service.validateSession("invalid-token");

    // Assert
    expect(result).toBeNull();
  });
});

describe("AuthService.refreshToken", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockSupabase);
    vi.clearAllMocks();
  });

  it("should refresh token successfully", async () => {
    // Arrange
    const mockSession = {
      access_token: "new-access-token",
      expires_in: 3600,
    };

    mockAuth.refreshSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Act
    const result = await service.refreshToken("valid-refresh-token");

    // Assert
    expect(result).toEqual({
      access_token: "new-access-token",
      expires_in: 3600,
    });
  });

  it("should throw error for invalid refresh token", async () => {
    // Arrange
    mockAuth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid refresh token" },
    });

    // Act & Assert
    await expect(service.refreshToken("invalid-refresh-token")).rejects.toThrow("Invalid refresh token");
  });
});