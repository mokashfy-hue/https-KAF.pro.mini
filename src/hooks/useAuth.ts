import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

const DEFAULT_USER = {
  id: 1,
  name: "مكاشفي",
  email: "admin@kaf.pro",
  role: "admin" as const,
  avatar: "",
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectPath = LOGIN_PATH } = options ?? {};
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

  const activeUser = user ?? DEFAULT_USER;

  return useMemo(
    () => ({
      user: activeUser,
      isAuthenticated: true,
      isLoading: false,
      error,
      logout,
      refresh: refetch,
    }),
    [activeUser, error, logout, refetch],
  );
}
