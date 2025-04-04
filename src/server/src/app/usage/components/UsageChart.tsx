"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Button } from "~/components/ui/button"; // Assuming you're using shadcn/ui
import { UsageTooltip } from "./UsageTooltip";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import ErrorAlert from "~/components/custom/ErrorAlert";

// Define a proper type for the usage data
interface UsageData {
  date: string;
  count: number;
  msEllapsed: number;
  estimatedCost: string;
}

export interface UsageChartProps {
  data: UsageData[];
  dataLoading: boolean;
}

export function UsageChart() {
  // Get Metric
  const [metric, setMetric] = React.useState<
    "count" | "msEllapsed" | "estimatedCost"
  >("estimatedCost");
  const [timeframe, setTimeframe] = React.useState<"week" | "month" | "year">(
    "week",
  );
  const [isMobile, setIsMobile] = useState(false);

  // Initialize window-dependent states safely
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load the Data
  const { data, isLoading, error } =
    timeframe === "week"
      ? api.usage.getWeekDailyUsage.useQuery({})
      : api.usage.getMonthDailyUsage.useQuery({});

  // Decide scale
  const max =
    data &&
    Math.max(
      ...data.map((d) => {
        if (typeof d[metric] === "number") {
          return d[metric];
        }
        return Math.ceil(parseFloat(d[metric]));
      }),
    );
  const ydomain = data && [0, max ?? 0];

  const dateTickFormatter = (date: string) => {
    if (timeframe === "week") {
      const dayOfWeek = new Date(date).toLocaleString("default", {
        weekday: "short",
      });
      return dayOfWeek;
    }

    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return date;

    const shortMonth = new Date(
      parseInt(year),
      parseInt(month) - 1,
    ).toLocaleString("default", { month: "short" });
    const out = `${shortMonth}. ${parseInt(day)}`;

    console.log(out, date);

    return out;
  };

  return (
    <div className="p-1 px-[50px]">
      {/* Buttons */}
      <div
        className={`flex ${isMobile ? "flex-col" : "justify-between"} mt-4 w-full gap-2`}
      >
        <div className="align-center flex flex-col justify-center">
          <div className="pb-2 font-semibold">Time Span</div>
          <div className="flex gap-2">
            {/* <Button variant={timeframe === 'year' ? "default" : 'outline'} onClick={() => setTimeframe('year')}>This Year</Button> */}
            <Button
              data-testid="month-button"
              variant={timeframe === "month" ? "default" : "outline"}
              onClick={() => setTimeframe("month")}
            >
              This Month
            </Button>
            <Button
              data-testid="week-button"
              variant={timeframe === "week" ? "default" : "outline"}
              onClick={() => setTimeframe("week")}
            >
              This Week
            </Button>
          </div>
        </div>

        <div className="align-center flex flex-col justify-center">
          <div className="pb-2 font-semibold">Metric</div>
          <div className="flex gap-2">
            <Button
              variant={metric === "estimatedCost" ? "default" : "outline"}
              onClick={() => setMetric("estimatedCost")}
            >
              Estimated Costs
            </Button>
            <Button
              variant={metric === "count" ? "default" : "outline"}
              onClick={() => setMetric("count")}
            >
              Bots Created
            </Button>
            <Button
              variant={metric === "msEllapsed" ? "default" : "outline"}
              onClick={() => setMetric("msEllapsed")}
            >
              Active Bot Time
            </Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        {data && data.length > 0 ? (
          <div data-testid="chart-container" className="h-full w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="date"
                  tickFormatter={dateTickFormatter} // Format YYYY-MM-DD
                />

                <YAxis
                  domain={ydomain}
                  allowDecimals={false}
                  tickFormatter={
                    metric === "msEllapsed"
                      ? (value) => (value / 60000).toFixed(2)
                      : undefined
                  }
                />

                <Tooltip content={<UsageTooltip metric={metric} />} />

                {/* Define the Line */}
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500} // Speed up animation (default is 1500)
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : isLoading ? (
          <Skeleton className="mt-2 h-[300px] w-100" />
        ) : error ? (
          <ErrorAlert errorMessage={error.message} />
        ) : (
          <div>No Data</div>
        )}
      </div>
    </div>
  );
}
