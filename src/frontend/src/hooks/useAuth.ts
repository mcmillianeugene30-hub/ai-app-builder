import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuth() {
  const {
    identity,
    login,
    clear,
    loginStatus,
    isInitializing,
    isLoggingIn,
    isLoginSuccess,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  const isAuthenticated = isLoginSuccess && !!identity;
  const principalText = identity?.getPrincipal().toText() ?? null;

  return {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginStatus,
    loginError,
    principalText,
    login,
    logout: clear,
  };
}
