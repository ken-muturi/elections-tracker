/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";

export const handleThrowError = (error: any): void => {
  const message = handleReturnError(error);
  throw new Error(message);
};

export const handleReturnError = (error: any): string => {
 if (!error || error === undefined) {
   console.error("An unknown error occurred:", error);
   return "An unknown error occurred.";
 }
 // Handle string errors directly
 if (typeof error === "string") {
   return error;
 }

 if (error instanceof Prisma.PrismaClientKnownRequestError) {
   switch (error.code) {
     case "P2002":
       // return "Unique constraint violation";
       const target = error.meta?.target;
       const targetFields = Array.isArray(target)
         ? target.join("', '")
         : String(target ?? "");

       return `Duplicate entry detected: ${
         error.meta?.modelName ?? ""
       } '${targetFields}' field(s) contains duplicate value.`;
     case "P2025":
       return "Record not found";
     default:
       return "Database error occurred";
   }
 } else if (error instanceof Prisma.PrismaClientValidationError) {
   // Handle validation errors
   console.error("Validation error:", error.message);
   return "Invalid query parameters";
 } else if (
   typeof error === "object" &&
   "message" in error &&
   typeof error.message === "string"
 ) {
   // Handle generic Error objects
   return error.message;
 } else {
   // Handle other types of errors
   console.error("Unexpected error:", error);
   return "An unexpected error occurred";
 }
};