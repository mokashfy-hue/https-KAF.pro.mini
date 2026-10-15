import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectPath = LOGIN_PATH, redirectOnUnauthenticated = false } = options ?? {};
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const isAuthenticated = Boolean(user);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated,
      isLoading,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isAuthenticated, isLoading, error, logout, refetch],
  );
}
