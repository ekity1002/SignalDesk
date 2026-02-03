import { unstable_createContext as createContext } from "react-router";

export type AuthContextData = {
  isAuthenticated: boolean;
  authenticatedAt: string | null;
};

export const authContext = createContext<AuthContextData>({
  isAuthenticated: false,
  authenticatedAt: null,
});
