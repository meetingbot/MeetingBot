import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseQuery } from "~/lib/testUtils";
import { type SelectBotType, type SelectEventType } from "~/server/db/schema";

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

// Explicitly import the components *after* the mocks
const { BotDetailsDialog } =
  require("../components/BotDetailsDialog") as typeof import("../components/BotDetailsDialog");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");

// Fake data that will be used to test the component
const startTimeString = "Mar 10, 2025, 11:30 AM";
const endTimeString = "Mar 10, 2025, 12:00 PM";
const fakeBotData: SelectBotType = {
  status: "JOINING_CALL",
  id: 1,
  createdAt: new Date(),
  userId: "123",
  botDisplayName: "Test Bot",
  botImage: "https://example.com/bot.png",
  meetingTitle: "Test Meeting",
  meetingInfo: {
    platform: "zoom",
  },
  startTime: new Date(startTimeString),
  endTime: new Date(endTimeString),
  recording: "https://example.com/recording.mp4",
  lastHeartbeat: new Date(),
  deploymentError: null,
  heartbeatInterval: 1000,
  callbackUrl: "https://example.com/callback",
  automaticLeave: {
    waitingRoomTimeout: 1000,
    noOneJoinedTimeout: 1000,
    everyoneLeftTimeout: 1000,
  },
};

const fakeEventsData: SelectEventType[] = [
  {
    eventTime: new Date("Mar 21, 2025, 11:30 AM"),
    eventType: "DONE",
    id: 1,
    data: {
      participantId: "123",
    },
    createdAt: new Date(),
    botId: 1,
  },
  {
    eventTime: new Date("Mar 21, 2025, 12:00 PM"),
    eventType: "FATAL",
    id: 2,
    data: {
      message: "Test error",
    },
    createdAt: new Date(),
    botId: 1,
  },
];

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("BotDetailsDialog", () => {
  it("If the get bot request is in progress, the user will observe a loading state", () => {
    // ARRANGE
    jest
      .mocked(api.bots.getBot.useQuery)
      .mockReturnValue(mockUseQuery({ isLoading: true }));

    jest
      .mocked(api.events.getEventsForBot.useQuery)
      .mockReturnValue(mockUseQuery({ data: fakeEventsData }));

    // ACT
    render(<BotDetailsDialog botId={1} onClose={() => void 0} />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If the get events request is in progress, the user will observe a loading state", () => {
    // ARRANGE
    jest
      .mocked(api.bots.getBot.useQuery)
      .mockReturnValue(mockUseQuery({ data: fakeBotData }));

    jest
      .mocked(api.events.getEventsForBot.useQuery)
      .mockReturnValue(mockUseQuery({ isLoading: true }));

    // ACT
    render(<BotDetailsDialog botId={1} onClose={() => void 0} />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If the get bot fetch throws an error, the user will see a corresponding error message", () => {
    // ARRANGE
    jest.mocked(api.bots.getBot.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
      }),
    );

    jest
      .mocked(api.events.getEventsForBot.useQuery)
      .mockReturnValue(mockUseQuery({}));

    // ACT
    render(<BotDetailsDialog botId={1} onClose={() => void 0} />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("If the get events fetch throws an error, the user will see a corresponding error message", () => {
    // ARRANGE
    jest
      .mocked(api.bots.getBot.useQuery)
      .mockReturnValue(mockUseQuery({ data: fakeBotData }));

    jest.mocked(api.events.getEventsForBot.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
      }),
    );

    // ACT
    render(<BotDetailsDialog botId={1} onClose={() => void 0} />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("If the get bot and get events fetches are successful, the user will observe the bot details on the screen", () => {
    // ARRANGE
    jest
      .mocked(api.bots.getBot.useQuery)
      .mockReturnValue(mockUseQuery({ data: fakeBotData }));

    jest
      .mocked(api.events.getEventsForBot.useQuery)
      .mockReturnValue(mockUseQuery({ data: fakeEventsData }));

    // ACT
    render(<BotDetailsDialog botId={1} onClose={() => void 0} />);

    // ASSERT
    expect(screen.getByText("Test Meeting")).toBeInTheDocument();
    expect(screen.getByText("JOINING_CALL")).toBeInTheDocument();
    expect(screen.getByText("DONE")).toBeInTheDocument();
    expect(screen.getByText("FATAL")).toBeInTheDocument();
  });
});
