import { Elysia, t } from "elysia";
import { AuthService } from "../services/AuthService";
import { config } from "../config";

export const authController = (authService: AuthService) =>
  new Elysia({ prefix: "/auth" })
    .post("/verify", ({ isAuthenticated }: any) => ({ valid: isAuthenticated }))
    .post(
      "/login",
      async ({ body, jwt, cookie, set }: any) => {
        if (authService.verifyKeyword(body.keyword)) {
          const token = await jwt.sign({
            authorized: true,
            role: "admin",
          });
          if (!cookie.auth) cookie.auth = {} as any;
          cookie.auth!.set({
            value: token,
            httpOnly: true,
            maxAge: 3 * 86400,
            path: "/",
            secure: config.nodeEnv === "production",
            sameSite: "lax",
          });
          return { success: true };
        }
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
