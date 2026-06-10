"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { getQueryClient } from "@/lib/query-client";
import { QueryAuthSync } from "@/components/auth/QueryAuthSync";

export function QueryProvider({ children }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <QueryAuthSync />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "font-sans text-sm",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#FACC15", secondary: "#1a1a1a" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
