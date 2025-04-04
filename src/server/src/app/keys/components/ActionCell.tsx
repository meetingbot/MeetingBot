import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Copy } from "lucide-react";

export default function ActionCell({
  key,
  id,
  isRevoked,
  setSelectedKeyId,
}: {
  key: string;
  id: number;
  isRevoked: boolean;
  setSelectedKeyId: (id: number) => void;
}) {
  const utils = api.useUtils();

  const revokeKey = api.apiKeys.revokeApiKey.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.listApiKeys.invalidate();
      toast.success("API Key revoked");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              toast.promise(navigator.clipboard.writeText(key), {
                loading: "Copying key...",
                success: "Key copied",
                error: "Failed to copy key",
              });
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Key
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedKeyId(id)}>
            View Logs
          </DropdownMenuItem>
          {!isRevoked && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={async () => await revokeKey.mutateAsync({ id })}
            >
              Revoke Key
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
