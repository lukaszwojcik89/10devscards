import { vi } from "vitest";

// Mock environment variables
vi.mock("@/env", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_KEY: "test-anon-key",
  OPENROUTER_API_KEY: "test-openrouter-key",
}));

// Mock Supabase client
vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock console methods in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
