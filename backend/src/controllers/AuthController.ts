import { Elysia, t } from "elysia";
import { AuthService } from "../services/AuthService";
import { config } from "../config";

// Simple in-memory login rate limiter, keyed by client IP.
const LOGIN_WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

const tooManyAttempts = (ip: string) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= MAX_ATTEMPTS;
};

const recordFailedAttempt = (ip: string) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
};

export const authController = (authService: AuthService) =>
  new Elysia({ prefix: "/auth" })
    .post("/verify", ({ isAuthenticated }: any) => ({ valid: isAuthenticated }))
    .post(
      "/login",
      async ({ body, jwt, cookie, set, request }: any) => {
        const ip = clientIp(request);
        if (tooManyAttempts(ip)) {
          set.status = 429;
          return { error: "Too many attempts. Try again later." };
        }

        if (authService.verifyKeyword(body.keyword)) {
          const token = await jwt.sign({
            authorized: true,
            role: "admin",
          });
          if (!cookie.auth) cookie.auth = {} as any;
          cookie.auth!.set({
            value: token,
            httpOnly: true,
            // Match the JWT lifetime — a 3-day cookie with a 30-day token
            // logged users out early.
            maxAge: 30 * 86400,
            path: "/",
            secure: config.nodeEnv === "production",
            sameSite: "lax",
          });
          return { success: true };
        }
        recordFailedAttempt(ip);
        set.status = 401;
        return { error: "Invalid keyword" };
      },
      {
        body: t.Object({
          keyword: t.String(),
        }),
      }
    )
    .post("/logout", ({ cookie }: any) => {
      if (cookie.auth) cookie.auth.remove();
      return { success: true };
    });

// Opportunistic cleanup so the map can't grow unbounded.
setInterval(() => {
  if (loginAttempts.size > 1000) {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts) {
      if (entry.resetAt < now) loginAttempts.delete(ip);
    }
  }
}, LOGIN_WINDOW_MS).unref();
