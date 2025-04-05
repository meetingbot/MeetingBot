import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Terminal } from "lucide-react";

interface ErrorAlertProps {
  errorMessage: string;
}

export default function ErrorAlert({ errorMessage }: ErrorAlertProps) {
  return (
    <Alert data-testid="error-alert" className="max-w-screen-sm">
      <Terminal className="h-4 w-4" />
      <AlertTitle>An error occurred</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}
