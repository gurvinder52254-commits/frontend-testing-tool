import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack QueryClient
 * - staleTime: 5 min  → no refetch on tab switch / component remount within 5 min
 * - gcTime: 30 min    → keep cached data in memory for 30 min after last use
 * - retry: 2          → retry failed requests twice before showing error
 * - refetchOnWindowFocus: false → prevent noisy refetches when switching windows
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,          // use cached data if still fresh
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
