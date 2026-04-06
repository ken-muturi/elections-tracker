/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client-safe error handler that extracts error messages
 * Use this in client components instead of the Prisma-dependent error-handling.ts
 */
export const handleReturnError = (error: any): string => {
  if (!error || error === undefined) {
    console.error("An unknown error occurred:", error);
    return "An unknown error occurred.";
  }
  
  // Handle string errors directly
  if (typeof error === "string") {
    return error;
  }

  // Handle Error objects with message property
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  // Handle other types of errors
  console.error("Unexpected error:", error);
  return "An unexpected error occurred";
};
