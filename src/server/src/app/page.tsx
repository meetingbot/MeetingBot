"use client";
import { Skeleton } from "~/components/ui/skeleton";
import Dashboard from "./components/Dashboard";
import WelcomeDashboard from "./components/WelcomeDashboard";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import ErrorAlert from "~/components/custom/ErrorAlert";

export default function Home() {
  const { data: session, status } = useSession();
  const {
    data: apiKeyCount,
    isLoading: apiKeyCountIsLoading,
    error: apiKeyCountError,
  } = api.apiKeys.getApiKeyCount.useQuery(
    {},
    {
      enabled: !!session,
    },
  );

  const isLoading = status === "loading" || apiKeyCountIsLoading;
  const showWelcome = !session || apiKeyCount?.count === 0;

  return (
    <main>
      {isLoading ? (
        <div>
          <>
            <div className="mt-5 mb-5">
              <h1 className="text-3xl font-bold">
                Welcome to Meeting Bot
                <Skeleton className="ml-2 inline-block h-8 w-80" />
              </h1>
              <p className="mt-2 text-gray-600">
                Easily create automated applications that leverage recordings
                across popular video meeting platforms.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="min-h-0">
                <Skeleton className="h-60 w-full" />
              </div>
              <div className="min-h-0">
                <Skeleton className="h-60 w-full" />
              </div>
              <div className="min-h-0">
                <Skeleton className="h-60 w-full" />
              </div>
              <div className="h-full min-h-0 lg:col-span-3">
                <Skeleton className="h-80 w-full" />
              </div>
            </div>
          </>
        </div>
      ) : apiKeyCountError ? (
        <ErrorAlert errorMessage={apiKeyCountError.message} />
      ) : showWelcome ? (
        <WelcomeDashboard />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}
