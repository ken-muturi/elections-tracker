'use client'

import { Provider as ChakraProvider } from "@/components/ui/provider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { UXProvider } from "@/context/UXContext";
import { SessionProvider } from "next-auth/react";
import { RtlProvider } from "@/context/RTLProvider";
import { Session } from "next-auth";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60 * (5 / 60), // 5 mins
      },
    },
  });

let browserQueryClient: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

export const Providers = ({
  children,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) => {
  const queryClient = getQueryClient();
  return (
    <ChakraProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <UXProvider>
            <RtlProvider>{children}</RtlProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </UXProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ChakraProvider>
  );
};