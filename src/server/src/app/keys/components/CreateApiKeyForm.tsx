"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { DialogClose } from "~/components/ui/dialog";
import { toast } from "sonner";

const getSixMonthsFromNowAtEndOfDay = () => {
  const sixMonthsFromNow = new Date(
    new Date().getTime() + 6 * 30 * 24 * 60 * 60 * 1000,
  );
  sixMonthsFromNow.setHours(23, 59, 59, 999);
  return sixMonthsFromNow;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  expiresAt: z.date().default(getSixMonthsFromNowAtEndOfDay()),
});

type CreateApiKeyFormProps = {
  onSuccess?: () => void;
};

export function CreateApiKeyForm({ onSuccess }: CreateApiKeyFormProps) {
  const utils = api.useUtils();
  const createApiKey = api.apiKeys.createApiKey.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.listApiKeys.invalidate();
      toast.success("API Key created", {
        description: "Your new API key has been created successfully.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      expiresAt: getSixMonthsFromNowAtEndOfDay(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Set time to end of day (23:59:59.999) in local time
    const expiresAt = new Date(values.expiresAt);
    expiresAt.setHours(23, 59, 59, 999);
    await createApiKey.mutateAsync({
      ...values,
      expiresAt,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  data-testid="name-input"
                  placeholder="Production API Key"
                  {...field}
                />
              </FormControl>
              <FormDescription>The name of the API key.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={
                      (date) => date < new Date() // Disable past dates
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When should this API key expire? Defaults to 6 months from now.
                The key will expire at the end of the selected day.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            data-testid="create-api-key-button"
            disabled={createApiKey.isPending}
          >
            {createApiKey.isPending ? "Creating..." : "Create API Key"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
