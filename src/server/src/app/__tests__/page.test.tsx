import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

// Mock the auth and API modules
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    apiKeys: {
      getApiKeyCount: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock components
jest.mock("../components/Dashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard">Dashboard Component</div>,
}));

jest.mock("../components/WelcomeDashboard", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="welcome-dashboard">Welcome Dashboard Component</div>
  ),
}));

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Home", () => {
  it("If the user is not signed in, they will see the Welcome Dashboard", () => {
    // ARRANGE
    // Mock useSession to return null (not logged in)
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: async () => null,
    });

    // Mock useQuery to not be called when not authenticated
    // @ts-expect-error - I am not mocking the complete useQuery hook, just the parts that are being used in the component
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue({
      data: undefined,
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("welcome-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("If the user has not yet created an API key, they will see the Welcome Dashboard", () => {
    // ARRANGE
    // Mock useSession to return authenticated user
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "fake_user_id",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: "authenticated",
      update: async () => null,
    });

    // @ts-expect-error - I am not mocking the complete useQuery hook, just the parts that are being used in the component
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue({
      data: { count: 0 },
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("welcome-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("If the user has created an API key, they will see the Dashboard", () => {
    // ARRANGE
    // Mock useSession to return authenticated user
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "fake_user_id",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: "authenticated",
      update: async () => null,
    });

    // @ts-expect-error - I am not mocking the complete useQuery hook, just the parts that are being used in the component
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue({
      data: { count: 1 },
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-dashboard")).not.toBeInTheDocument();
  });

  it("If auth is loading, the page will show a skeleton", () => {
    // ARRANGE
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: async () => null,
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If trpc query is loading, the page will show a skeleton", () => {
    // ARRANGE
    // @ts-expect-error - I am not mocking the complete useQuery hook, just the parts that are being used in the component
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue({
      data: undefined,
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If trpc query threw an error, the page will show an error alert", () => {
    // ARRANGE

    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "fake_user_id",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: "authenticated",
      update: async () => null,
    });

    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue({
      // @ts-expect-error - I am not mocking the complete useQuery hook, just the parts that are being used in the component
      error: {
        message: "Test error",
      },
      isLoading: false,
    });

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });
});
