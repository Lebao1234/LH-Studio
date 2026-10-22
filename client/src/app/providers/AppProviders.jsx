import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/features/auth/AuthProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      // Never retry client errors (401 is handled by the axios refresh interceptor).
      retry: (count, error) => {
        const status = error?.response?.status
        if (status && status < 500) return false
        return count < 2
      },
    },
    mutations: { retry: false },
  },
})

export function AppProviders({ children }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
