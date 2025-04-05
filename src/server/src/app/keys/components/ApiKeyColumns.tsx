"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import dayjs from "dayjs";
import ActionCell from "./ActionCell";

// Define the ApiKey type inline
type ApiKey = {
  id: number;
  name: string;
  userId: string;
  createdAt: Date | null;
  key: string;
  isRevoked: boolean | null;
};

export const columns = (
  setSelectedKeyId: (id: number) => void,
): ColumnDef<ApiKey>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue<Date>("createdAt");
      return date ? dayjs(date).format("MMMM D, YYYY") : "-";
    },
  },
  {
    accessorKey: "isRevoked",
    header: "Status",
    cell: ({ row }) => {
      const isRevoked = row.getValue("isRevoked");
      return (
        <Badge variant={isRevoked ? "destructive" : "default"}>
          {isRevoked ? "Revoked" : "Active"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const apiKey = row.original;
      return (
        <ActionCell
          key={apiKey.key}
          id={apiKey.id}
          isRevoked={apiKey.isRevoked ?? false}
          setSelectedKeyId={setSelectedKeyId}
        />
      );
    },
  },
];
