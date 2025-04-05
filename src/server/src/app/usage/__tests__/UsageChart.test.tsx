import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseQuery } from "~/lib/testUtils";
import { type DailyUsageType } from "~/server/db/schema";

// Fake data that will be used to test the component
const fakeWeeklyUsageData: DailyUsageType[] = Array.from(
  { length: 7 },
  (_, i) => ({
    date: `Mar ${i + 1}, 2025`,
    count: i,
    msEllapsed: 100 * i,
    estimatedCost: `${100 * i}`,
  }),
);

const fakeMonthlyUsageData: DailyUsageType[] = Array.from(
  { length: 30 },
  (_, i) => ({
    date: `Apr ${i + 1}, 2025`,
    count: i,
    msEllapsed: 100 * i,
    estimatedCost: `${100 * i}`,
  }),
);

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

class ResizeObserverMock {
  observe() {
    /*Mock implementation*/
  }
  unobserve() {
    /*Mock implementation*/
  }
  disconnect() {
    /*Mock implementation*/
  }
}

global.ResizeObserver = ResizeObserverMock;

// Explicitly import the components *after* the mocks
const { UsageChart } =
  require("../components/UsageChart") as typeof import("../components/UsageChart");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("UsageChart", () => {
  it("If the users usage details are currently fetching, they will observe a loading state", () => {
    // ARRANGE
    jest.mocked(api.usage.getWeekDailyUsage.useQuery).mockReturnValue(
      mockUseQuery({
        isLoading: true,
      }),
    );

    // ACT
    render(<UsageChart />);

    // ASSERT
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("If the fetch throws an error, the user will see a corresponding error message", () => {
    // ARRANGE
    jest.mocked(api.usage.getWeekDailyUsage.useQuery).mockReturnValue(
      mockUseQuery({
        error: {
          message: "Test error",
        },
      }),
    );

    // ACT
    render(<UsageChart />);

    // ASSERT
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("If the fetch is successful, the user will observe the usage, aggregated by the selected time period, displayed on a graph", () => {
    // ARRANGE
    jest.mocked(api.usage.getWeekDailyUsage.useQuery).mockReturnValue(
      mockUseQuery({
        data: fakeWeeklyUsageData,
      }),
    );

    // ACT
    render(<UsageChart />);

    // ASSERT
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });

  it("If the user changes the selected time period, the graph will switch to the new selected time period", () => {
    // ARRANGE
    jest.mocked(api.usage.getWeekDailyUsage.useQuery).mockReturnValue(
      mockUseQuery({
        data: fakeWeeklyUsageData,
      }),
    );

    jest.mocked(api.usage.getMonthDailyUsage.useQuery).mockReturnValue(
      mockUseQuery({
        data: fakeMonthlyUsageData,
      }),
    );

    // ACT
    render(<UsageChart />);

    // ASSERT
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();

    // Click the month button
    fireEvent.click(screen.getByTestId("month-button"));

    // ASSERT
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });
});
