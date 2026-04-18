import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import type { ReactNode } from "react";

// -----------------------------
// Global Mocks
// -----------------------------

// Router mock
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// Fetch mock
const mockFetch = vi.fn();
// global.fetch = mockFetch as any;
global.fetch = mockFetch as unknown as typeof global.fetch;

// -----------------------------
// Test Consumer
// -----------------------------
function TestConsumer({ action }: { action?: string }) {
  const { user, isAuthenticated, isLoading, login, logout, hasRole } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : "null"}</span>

      <span data-testid="has-admin">{String(hasRole("admin"))}</span>
      <span data-testid="has-manager">{String(hasRole("manager"))}</span>
      <span data-testid="has-viewer">{String(hasRole("viewer"))}</span>

      {action === "login" && (
        <button
          onClick={async () => {
            try {
              await login({
                email: "test@example.com",
                password: "password123",
              });
            } catch {}
          }}
        >
          Login
        </button>
      )}

      {action === "logout" && (
        <button onClick={() => logout()}>Logout</button>
      )}
    </div>
  );
}

// -----------------------------
// Render Helper
// -----------------------------
function renderWithProvider(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

// -----------------------------
// Test Suite
// -----------------------------
describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockPush.mockClear();
    // Default: backend session rehydration returns 401. Individual tests
    // override with mockResolvedValueOnce when they need a user.
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/auth/me')) {
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  afterAll(() => {
    // restore global fetch
    // @ts-error
    global.fetch = undefined;
  });

  // -----------------------------
  // useAuth outside provider
  // -----------------------------
  describe("useAuth outside provider", () => {
    it("throws when used outside AuthProvider", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        "useAuth must be used inside <AuthProvider>"
      );

      spy.mockRestore();
    });
  });

  // -----------------------------
  // Initial State
  // -----------------------------
  describe("initial state", () => {
    it("starts with no user and eventually loading=false", async () => {
      renderWithProvider(<TestConsumer />);

      expect(screen.getByTestId("user").textContent).toBe("null");

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });
    });

    it("rehydrates user from sessionStorage", async () => {
      const storedUser = {
        id: "1",
        email: "test@example.com",
        name: "Test",
        role: "admin",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(storedUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
        expect(screen.getByTestId("user").textContent).toContain(
          "test@example.com"
        );
      });
    });

    it("handles invalid sessionStorage JSON gracefully", async () => {
      sessionStorage.setItem("crm_user", "invalid-json{");

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
        expect(screen.getByTestId("user").textContent).toBe("null");
      });
    });
  });

  // -----------------------------
  // Login
  // -----------------------------
  describe("login", () => {
    it("authenticates user and navigates to dashboard", async () => {
      const userObj = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      };

      // First fetch is /api/auth/me on mount (no session yet → 401).
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      // Second fetch is the login POST.
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: userObj }),
      });

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="login" />);

      await user.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      expect(mockPush).toHaveBeenCalledWith("/dashboard");

      const stored = JSON.parse(sessionStorage.getItem("crm_user")!);
      expect(stored.email).toBe("test@example.com");
    });

    it("handles failed login with server message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid credentials" }),
      });

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();

      renderWithProvider(<TestConsumer action="login" />);
      await user.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
      });

      spy.mockRestore();
    });

    it("handles failed login with no JSON body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("no json");
        },
      });

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();

      renderWithProvider(<TestConsumer action="login" />);
      await user.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
      });

      spy.mockRestore();
    });
  });

  // -----------------------------
  // Logout
  // -----------------------------
  describe("logout", () => {
    it("clears user and navigates to login", async () => {
      const storedUser = {
        id: "1",
        email: "test@example.com",
        name: "Test",
        role: "admin",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(storedUser));

      mockFetch.mockResolvedValueOnce({ ok: true });

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="logout" />);

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      await user.click(screen.getByText("Logout"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
        expect(screen.getByTestId("user").textContent).toBe("null");
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(sessionStorage.getItem("crm_user")).toBeNull();
    });

    it("still clears state if logout API fails", async () => {
      const storedUser = {
        id: "1",
        email: "test@example.com",
        name: "Test",
        role: "manager",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(storedUser));

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="logout" />);

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      await user.click(screen.getByText("Logout"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  // -----------------------------
  // Role Logic
  // -----------------------------
  describe("hasRole", () => {
    it("admin has all roles", async () => {
      const adminUser = {
        id: "1",
        email: "a@b.com",
        name: "Admin",
        role: "admin",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(adminUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("has-admin").textContent).toBe("true");
        expect(screen.getByTestId("has-manager").textContent).toBe("true");
        expect(screen.getByTestId("has-viewer").textContent).toBe("true");
      });
    });

    it("manager has manager + viewer", async () => {
      const managerUser = {
        id: "1",
        email: "a@b.com",
        name: "Manager",
        role: "manager",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(managerUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("has-admin").textContent).toBe("false");
        expect(screen.getByTestId("has-manager").textContent).toBe("true");
        expect(screen.getByTestId("has-viewer").textContent).toBe("true");
      });
    });

    it("viewer only has viewer", async () => {
      const viewerUser = {
        id: "1",
        email: "a@b.com",
        name: "Viewer",
        role: "viewer",
      };
      sessionStorage.setItem("crm_user", JSON.stringify(viewerUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("has-admin").textContent).toBe("false");
        expect(screen.getByTestId("has-manager").textContent).toBe("false");
        expect(screen.getByTestId("has-viewer").textContent).toBe("true");
      });
    });

    it("returns false for all roles when no user", async () => {
      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId("has-admin").textContent).toBe("false");
        expect(screen.getByTestId("has-viewer").textContent).toBe("false");
      });
    });
  });
});
