import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTrpcApiMock, mockUseMutation } from "~/lib/testUtils";

jest.mock("next-auth/react");
jest.mock("~/trpc/react", () => createTrpcApiMock());

// Mock the toast component
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const { CreateApiKeyForm } =
  require("../components/CreateApiKeyForm") as typeof import("../components/CreateApiKeyForm");
const { api } = require("~/trpc/react") as typeof import("~/trpc/react");
const { Dialog, DialogContent, DialogTitle, DialogDescription } =
  require("~/components/ui/dialog") as typeof import("~/components/ui/dialog");
const { toast } = require("sonner") as typeof import("sonner");

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("CreateApiKeyForm", () => {
  it("If the user enters a name and clicks the Generate API Key button, it will make the corresponding request with the date being 6 months from now", async () => {
    // ARRANGE
    const mockMutateAsync = jest.fn();

    jest.mocked(api.apiKeys.createApiKey.useMutation).mockReturnValue(
      mockUseMutation({
        mutateAsync: mockMutateAsync,
      }),
    );

    // ACT
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Fill out this form to create a new API key.
          </DialogDescription>
          <CreateApiKeyForm />
        </DialogContent>
      </Dialog>,
    );

    // Fill in the name
    const nameInput = screen.getByTestId("name-input");
    fireEvent.change(nameInput, { target: { value: "Test Key" } });

    // Click the generate key button
    const generateButton = screen.getByTestId("create-api-key-button");
    fireEvent.click(generateButton);

    // ASSERT
    // 6 months from now at the end of the day
    const sixMonthsFromNow = new Date(
      new Date().getTime() + 6 * 30 * 24 * 60 * 60 * 1000,
    );
    sixMonthsFromNow.setHours(23, 59, 59, 999);

    // Assert that the mutation was called with the correct arguments
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: "Test Key",
        expiresAt: sixMonthsFromNow,
      });
    });
  });

  it("If the request is in progress, the user will observe a loading state", async () => {
    // ARRANGE
    jest.mocked(api.apiKeys.createApiKey.useMutation).mockReturnValue(
      mockUseMutation({
        isPending: true,
      }),
    );

    // ACT
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Fill out this form to create a new API key.
          </DialogDescription>
          <CreateApiKeyForm />
        </DialogContent>
      </Dialog>,
    );

    // ASSERT
    expect(screen.getByText("Creating...")).toBeInTheDocument();
  });

  it("If the request is successful, the user will observe a success message, and the list of API keys will refetch", async () => {
    // ARRANGE
    const mockInvalidate = jest.fn();

    const mockUseUtils = jest.fn().mockReturnValue({
      apiKeys: {
        listApiKeys: {
          invalidate: mockInvalidate,
        },
      },
    });

    (api.useUtils as jest.Mock).mockImplementation(mockUseUtils);

    // Mock the toast
    const mockToastSuccess = jest.fn();
    jest.mocked(toast.success).mockImplementation(mockToastSuccess);

    // Mock the mutation with onSuccess callback

    const mockMutation = (
      api.apiKeys.createApiKey.useMutation as jest.Mock
    ).mockReturnValue(mockUseMutation({}));

    // ACT
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Fill out this form to create a new API key.
          </DialogDescription>
          <CreateApiKeyForm />
        </DialogContent>
      </Dialog>,
    );

    // ASSERT

    // Get the options that were passed to the mutation (first argument)
    const mutationOptions = mockMutation?.mock?.calls?.[0]?.[0];

    // If an onSuccess callback was passed, trigger it
    if (mutationOptions && typeof mutationOptions.onSuccess === "function") {
      await mutationOptions?.onSuccess(
        {
          id: 1,
          name: "fake_name",
          createdAt: new Date(),
          userId: "fake_user_id",
          key: "fake_key",
          lastUsedAt: new Date(),
          expiresAt: new Date(),
          isRevoked: false,
        },
        {
          name: "fake_name",
          expiresAt: new Date(),
        },
        {},
      );
    }

    // Verify toast was called with correct message
    expect(mockToastSuccess).toHaveBeenCalledWith("API Key created", {
      description: "Your new API key has been created successfully.",
    });

    // Verify invalidate was called
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("If the request throws an error, the user will observe an error message", async () => {
    // ARRANGE

    // Mock the toast
    const mockToastError = jest.fn();
    jest.mocked(toast.error).mockImplementation(mockToastError);

    const mockMutation = (
      api.apiKeys.createApiKey.useMutation as jest.Mock
    ).mockReturnValue(mockUseMutation({}));

    // ACT
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Fill out this form to create a new API key.
          </DialogDescription>
          <CreateApiKeyForm />
        </DialogContent>
      </Dialog>,
    );

    // ASSERT

    // Get the options that were passed to the mutation (first argument)
    const mutationOptions = mockMutation?.mock?.calls?.[0]?.[0];

    // If an onError callback was passed, trigger it
    if (mutationOptions && typeof mutationOptions.onError === "function") {
      await mutationOptions.onError(
        {
          message: "Test error",
        } as unknown as Parameters<typeof mutationOptions.onError>[0],
        {
          name: "fake_name",
          expiresAt: new Date(),
        },
        {},
      );
    }

    // Verify toast was called with correct message
    expect(mockToastError).toHaveBeenCalledWith("Error", {
      description: "Test error",
    });
  });
});
