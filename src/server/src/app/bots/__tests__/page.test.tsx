import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseQuery } from "~/lib/testUtils";

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

// Mock sub components~ We are only concerned with the bot table
jest.mock("../components/BotDetailsDialog", () => ({
  __esModule: true,
  BotDetailsDialog: () => (
    <div data-testid="bot-details-dialog">Bot Details Dialog Component</div>
  ),
}));

// Explicitly import the components *after* the mocks
const { default: Bots } = require("../page") as typeof import("../page");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Bots", () => {
  it("If the user's bots are currently fetching, they will observe a loading state", () => {
    // ARRANGE
    // bots are loading
    jest.mocked(api.bots.getBots.useQuery).mockReturnValue(
      mockUseQuery({
        isLoading: true,
      }),
    );

    // ACT
    render(<Bots />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If the fetch throws an error, the user will see a corresponding error message", () => {
    // ARRANGE
    // bots are an error
    jest.mocked(api.bots.getBots.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
      }),
    );

    // ACT
    render(<Bots />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("If the fetch is successful, the user will observe the bots listed in a table on the screen", () => {
    // ARRANGE

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // bots are successful
    jest.mocked(api.bots.getBots.useQuery).mockReturnValue(
      mockUseQuery({
        data: [
          {
            createdAt: twentyDaysAgo,
            status: "JOINING_CALL",
            recording: "https://example.com/recording.mp4",
            meetingInfo: {
              platform: "zoom",
            },
          },
          {
            createdAt: oneDayAgo,
            status: "FATAL",
            recording: "https://example.com/recording2.mp4",
            meetingInfo: {
              platform: "google",
            },
          },
        ],
      }),
    );

    // ACT
    render(<Bots />);

    // ASSERT
    expect(screen.getByText("Zoom")).toBeInTheDocument();
    expect(screen.getByText("JOINING_CALL")).toBeInTheDocument();
    expect(screen.getByText("20 days ago")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("FATAL")).toBeInTheDocument();
    expect(screen.getByText("1 day ago")).toBeInTheDocument();
  });
});
