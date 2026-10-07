import { authRouter } from "./auth-router";
import { financeRouter } from "./finance-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  finance: financeRouter,
});

export type AppRouter = typeof appRouter;
