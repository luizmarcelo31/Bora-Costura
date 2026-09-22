import { useEffect, useState } from "react";
import { getCurrentUser, authEnabled, type AuthUser } from "./client";

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

export function useCurrentUserState(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({
    user: null,
    isPending: authEnabled,
  });

  useEffect(() => {
    if (!authEnabled) {
      setState({ user: DEV_USER, isPending: false });
      return;
    }
    let cancelled = false;
    getCurrentUser().then((u) => {
      if (cancelled) return;
      setState({
        user: u
          ? {
              id: u.id,
              displayName: u.name,
              primaryEmail: u.email,
              profileImageUrl: u.image,
              isDevFallback: false,
            }
          : null,
        isPending: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
