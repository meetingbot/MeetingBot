import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GITHUB_ID: z.string(),
    AUTH_GITHUB_SECRET: z.string(),
    DATABASE_URL: z.string().url().startsWith("postgresql://"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GITHUB_TOKEN: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_BUCKET_NAME: z.string(),
    AWS_REGION: z.string(),
    ECS_TASK_DEFINITION_MEET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().default(""),
    ECS_TASK_DEFINITION_TEAMS:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().default(""),
    ECS_TASK_DEFINITION_ZOOM:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().default(""),
    ECS_CLUSTER_NAME:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().default(""),
    ECS_SUBNETS:
      process.env.NODE_ENV === "production"
        ? z.preprocess(
            (val) => (typeof val === "string" ? val.split(",") : []),
            z.array(z.string()),
          )
        : z.array(z.string()).default([]),
    ECS_SECURITY_GROUPS:
      process.env.NODE_ENV === "production"
        ? z.preprocess(
            (val) => (typeof val === "string" ? val.split(",") : []),
            z.array(z.string()),
          )
        : z.array(z.string()).default([]),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    ECS_TASK_DEFINITION_MEET: process.env.ECS_TASK_DEFINITION_MEET,
    ECS_TASK_DEFINITION_TEAMS: process.env.ECS_TASK_DEFINITION_TEAMS,
    ECS_TASK_DEFINITION_ZOOM: process.env.ECS_TASK_DEFINITION_ZOOM,
    ECS_CLUSTER_NAME: process.env.ECS_CLUSTER_NAME,
    ECS_SUBNETS: process.env.ECS_SUBNETS,
    ECS_SECURITY_GROUPS: process.env.ECS_SECURITY_GROUPS,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
