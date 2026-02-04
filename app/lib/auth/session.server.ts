import { createCookieSessionStorage } from "react-router";

type SessionData = {
  isAuthenticated: boolean;
  authenticatedAt: string;
};

type SessionFlashData = {
  error: string;
};

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__signaldesk_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: isProduction,
  },
});
