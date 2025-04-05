/**
 * This file is used to mock the next-auth/react module used by front-end code to get the user's session.
 */

// Create a mock function for useSession
const useSession = jest.fn();

// Export the mock function
export { useSession };
