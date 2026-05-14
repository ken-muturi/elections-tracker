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
     case "P2003":
       return "Cannot delete this record because other records depend on it.";
     case "P2025":
       return "Record not found";
     default:
       return "Database error occurred";
   }
 } else if (error instanceof Prisma.PrismaClientValidationError) {
   // Handle validation errors
   console.error("Validation error:", error.message);
   return "Invalid query parameters";
 } else if (error instanceof Prisma.PrismaClientInitializationError) {
   // DB unreachable — NEVER expose connection string or host to client
   console.error("[DB] Initialization error:", error.message);
   return "Database connection failed. Please contact support.";
 } else if (
   typeof error === "object" &&
   "message" in error &&
   typeof error.message === "string"
 ) {
   // Log the real message server-side but only return it if it doesn't look
   // like a connection string, stack trace, or internal detail.
   const msg: string = error.message;
   const isSensitive =
     msg.includes("postgresql://") ||
     msg.includes("mysql://") ||
     msg.includes("mongodb://") ||
     msg.includes("neon.tech") ||
     msg.includes("at Object.") ||
     msg.includes("ECONNREFUSED") ||
     msg.includes("ssl") ||
     msg.includes("password") ||
     msg.includes("\n    at ");
   if (isSensitive) {
     console.error("[Server error – suppressed from client]:", msg);
     return "A server error occurred. Please try again or contact support.";
   }
   return msg;
 } else {
   // Handle other types of errors
   console.error("Unexpected error:", error);
   return "An unexpected error occurred";
 }
};