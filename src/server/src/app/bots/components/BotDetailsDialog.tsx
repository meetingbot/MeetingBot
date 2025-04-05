"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { DataTable } from "~/components/custom/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import Image from "next/image";
import ErrorAlert from "~/components/custom/ErrorAlert";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

interface BotDetailsDialogProps {
  botId: number | null;
  onClose: () => void;
}

export function BotDetailsDialog({ botId, onClose }: BotDetailsDialogProps) {
  const {
    data: bot,
    isLoading: botLoading,
    error: botError,
  } = api.bots.getBot.useQuery({ id: botId! }, { enabled: !!botId });

  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = api.events.getEventsForBot.useQuery(
    { botId: botId! },
    { enabled: !!botId },
  );

  const eventColumns: ColumnDef<(typeof events)[number]>[] = [
    {
      accessorKey: "eventTime",
      header: "Time",
      cell: ({ row }) => format(new Date(row.original.eventTime), "PPp"),
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
      cell: ({ row }) => {
        const eventType = row.original.eventType;
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {eventType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
  ];

  return (
    <Dialog open={!!botId} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bot Details</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        <div className="space-y-6">
          {botError ? (
            <ErrorAlert errorMessage={botError.message} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Meeting Details</h3>

                <div className="space-y-1 text-sm">
                  {botLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <p>
                      <span className="font-medium">Title:</span>{" "}
                      {bot?.meetingTitle}
                    </p>
                  )}
                  {botLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Platform:</span>
                      {typeof bot?.meetingInfo.platform === "string" && (
                        <Image
                          src={`/platform-logos/${bot.meetingInfo.platform}.svg`}
                          alt={bot.meetingInfo.platform}
                          width={16}
                          height={16}
                        />
                      )}
                      {bot?.meetingInfo.platform as string | undefined}
                    </p>
                  )}
                  {botLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <p>
                      <span className="font-medium">Start:</span>{" "}
                      {bot?.startTime
                        ? format(new Date(bot.startTime), "PPp")
                        : "None"}
                    </p>
                  )}
                  {botLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p>
                      <span className="font-medium">End:</span>{" "}
                      {bot?.endTime
                        ? format(new Date(bot.endTime), "PPp")
                        : "None"}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Bot Status</h3>
                <div className="space-y-1 text-sm">
                  {botLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800"
                      >
                        {bot?.status}
                      </Badge>
                    </p>
                  )}
                  {botLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p>
                      <span className="font-medium">Recording:</span>{" "}
                      {bot?.recording ? (
                        <Link href={bot.recording} target="_blank">
                          {bot.recording}{" "}
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Link>
                      ) : (
                        "Not available"
                      )}
                    </p>
                  )}
                  {botLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <p>
                      <span className="font-medium">Last Heartbeat:</span>{" "}
                      {bot?.lastHeartbeat
                        ? format(new Date(bot.lastHeartbeat), "PPp")
                        : "None"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-semibold">Event Log</h3>
            <DataTable
              columns={eventColumns}
              data={events}
              isLoading={botLoading || eventsLoading}
              errorMessage={eventsError?.message}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
