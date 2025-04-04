import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseQuery } from "~/lib/testUtils";

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

// Mock sub components~ We are only concerned with the key table
jest.mock("../components/CreateApiKeyDialog", () => ({
  __esModule: true,
  CreateApiKeyDialog: () => (
    <div data-testid="create-api-key-dialog">
      Create API Key Dialog Component
    </div>
  ),
}));

jest.mock("../components/ViewLogsDialog", () => ({
  __esModule: true,
  ViewLogsDialog: () => (
    <div data-testid="view-logs-dialog">View Logs Dialog Component</div>
  ),
}));

jest.mock("../components/ActionCell", () => ({
  __esModule: true,
  default: () => <div data-testid="action-cell">Action Cell Component</div>,
}));

// Explicitly import the components *after* the mocks
const { default: Keys } = require("../page") as typeof import("../page");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Keys", () => {
  it("If the user's API keys are currently fetching, they will observe a loading state", () => {
    // ARRANGE
    // keys are loading
    jest.mocked(api.apiKeys.listApiKeys.useQuery).mockReturnValue(
      mockUseQuery({
        isLoading: true,
      }),
    );

    // ACT
    render(<Keys />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If the fetch throws an error, the user will see a corresponding error message", () => {
    // ARRANGE
    // keys are an error
    jest.mocked(api.apiKeys.listApiKeys.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
        isLoading: false,
      }),
    );

    // ACT
    render(<Keys />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("If the fetch is successful, the user will observe the keys listed in a table on the screen", () => {
    // ARRANGE
    // keys are successful
    jest.mocked(api.apiKeys.listApiKeys.useQuery).mockReturnValue(
      mockUseQuery({
        data: [
          { id: "1", name: "Key 1", key: "123", isRevoked: false },
          { id: "2", name: "Key 2", key: "456", isRevoked: true },
        ],
        isLoading: false,
        error: undefined,
      }),
    );

    // ACT
    render(<Keys />);

    // ASSERT
    expect(screen.getByText("Key 1")).toBeInTheDocument();
    expect(screen.getByText("Key 2")).toBeInTheDocument();
  });
});
