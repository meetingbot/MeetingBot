import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseQuery } from "~/lib/testUtils";

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

// Mock Dashboards~ We are only concerned with which dashboard is rendered (rather than the functionalit of each Dashboard)
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

// Explicitly import the components *after* the mocks
const { default: Home } = require("../page") as typeof import("../page");
const { useSession } =
  require("next-auth/react") as typeof import("next-auth/react");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Home", () => {
  it("If the user is not signed in, they will see the Welcome Dashboard", () => {
    // ARRANGE
    // user is not signed in
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: async () => null,
    });

    // no key count is fetched
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue(
      mockUseQuery({
        data: undefined,
      }),
    );

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("welcome-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("If the user has not yet created an API key, they will see the Welcome Dashboard", () => {
    // ARRANGE
    // user is authenticated
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

    // key count is 0
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue(
      mockUseQuery({
        data: { count: 0 },
      }),
    );

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("welcome-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("If the user has created an API key, they will see the Dashboard", () => {
    // ARRANGE
    // user is authenticated
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

    // key count is 1
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue(
      mockUseQuery({
        data: { count: 1 },
      }),
    );

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-dashboard")).not.toBeInTheDocument();
  });

  it("If auth is loading, the page will show a skeleton", () => {
    // ARRANGE
    // auth is loading
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
    // key count is loading
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue(
      mockUseQuery({
        data: undefined,
      }),
    );

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If trpc query threw an error, the page will show an error alert", () => {
    // ARRANGE
    // user is authenticated
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

    // key count is an error
    jest.mocked(api.apiKeys.getApiKeyCount.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
      }),
    );

    // ACT
    render(<Home />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });
});
