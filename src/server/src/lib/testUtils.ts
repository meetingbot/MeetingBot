import {
  type TRPC_ERROR_CODE_KEY,
  type TRPC_ERROR_CODE_NUMBER,
} from "@trpc/server/rpc";
import {
  type UseTRPCMutationResult,
  type UseTRPCQueryResult,
} from "@trpc/react-query/shared";
import { type TRPCClientErrorLike } from "@trpc/client";
import type { typeToFlattenedError } from "zod";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";

/**
 * This is a utility function to create a mock for React Query.
 * It is used to mock the useQuery, useMutation, and invalidate hooks, which are the only hooks used in the frontend.
 * It is used in the test files to mock the API responses.
 * Note: We use the Type variable M to avoid explicitly importing react here (it will cause react-related errors)
 */

interface TrpcApiMock {
  [key: string]: jest.Mock | TrpcApiMock;
}

const createTrpcApiMock = (): TrpcApiMock => {
  return new Proxy({} as TrpcApiMock, {
    get: (target, prop: string) => {
      if (!(prop in target)) {
        if (
          prop === "useQuery" ||
          prop === "useMutation" ||
          prop === "invalidate" ||
          prop === "useUtils"
        ) {
          target[prop] = jest.fn();
        } else {
          target[prop] = createTrpcApiMock();
        }
      }

      return target[prop];
    },
  });
};

/**
 * This is a utility function to create a valid return value (no type errors) for useQuery
 */

type useQueryMockInput<OutputType> = {
  data?: OutputType;
  error?: {
    message: string;
  };
  isLoading?: boolean;
};

type clientError<InputType, OutputType> = TRPCClientErrorLike<{
  input: InputType;
  output: OutputType;
  transformer: true;
  errorShape: {
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zodError: typeToFlattenedError<any, string> | null;
      code: TRPC_ERROR_CODE_KEY;
      httpStatus: number;
      path?: string;
      stack?: string;
    };
    message: string;
    code: TRPC_ERROR_CODE_NUMBER;
  };
}>;

type useQueryResults<InputType, OutputType> = UseTRPCQueryResult<
  InputType,
  clientError<InputType, OutputType>
>;

const mockUseQuery = <InputType, OutputType>({
  data,
  error,
  isLoading,
}: useQueryMockInput<OutputType>): useQueryResults<InputType, OutputType> => {
  return {
    data,
    error: error ? { message: error.message } : null,
    isLoading: error ? false : (isLoading ?? false),
  } as useQueryResults<InputType, OutputType>;
};

/**
 * This is a utility function to create a valid return value (no type errors) for useMutation
 */

type useMutationMockInput = {
  isPending?: boolean;
  mutateAsync?: jest.Mock;
};

type useMutationResults<InputType, OutputType> = UseTRPCMutationResult<
  OutputType,
  clientError<InputType, OutputType>,
  InputType,
  unknown
>;

const mockUseMutation = <InputType, OutputType>({
  isPending,
  mutateAsync,
}: useMutationMockInput): useMutationResults<InputType, OutputType> => {
  return {
    isPending: isPending ?? false,
    mutateAsync: (mutateAsync ?? jest.fn()) as UseMutateAsyncFunction<
      OutputType,
      clientError<InputType, OutputType>,
      InputType,
      unknown
    >,
  } as unknown as useMutationResults<InputType, OutputType>;
};

export { createTrpcApiMock, mockUseQuery, mockUseMutation };
