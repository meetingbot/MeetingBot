/**
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { OpenApiMeta } from 'trpc-openapi'
import { db } from '../db'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { TRPCError } from '@trpc/server'
import { apiKeys, apiRequestLogs } from '../db/schema'
import { eq, and, or, gt, lte, isNull } from 'drizzle-orm'
import { getSession, Session } from '@auth/express'
import { authConfig } from './auth'

export const createTRPCContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const session =
    (res.locals.session as Session | null) ??
    (await getSession(req, authConfig))
  return {
    db,
    headers: req.headers,
    req,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      }
    },
  })

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const procedure = t.procedure

const getStatusCode = (e: unknown) => {
  return e instanceof TRPCError
    ? {
        BAD_REQUEST: 400,
        PARSE_ERROR: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_SUPPORTED: 405,
        TIMEOUT: 408,
        CONFLICT: 409,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        UNPROCESSABLE_CONTENT: 422,
        TOO_MANY_REQUESTS: 429,
        CLIENT_CLOSED_REQUEST: 499,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
      }[e.code] || 500
    : 500
}

// Create a middleware that checks for a valid API key or session and logs the request
const authMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const apiKey = ctx.headers['x-api-key']
  const { session } = ctx
  let error = null
  let statusCode = 200

  if (apiKey && typeof apiKey === 'string') {
    const startTime = Date.now()
    let apiKeyRecord = null

    try {
      // Check if the API key exists and is not revoked and not expired
      const apiKeyResult = await ctx.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.key, apiKey),
            eq(apiKeys.isRevoked, false),
            // Add check for not expired (either expiresAt is null or it's in the future)
            or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date()))
          )
        )

      if (!apiKeyResult[0]) {
        // Check if the key exists but is expired
        const expiredKeyResult = await ctx.db
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.key, apiKey),
              eq(apiKeys.isRevoked, false),
              // Check if it exists but is expired
              lte(apiKeys.expiresAt, new Date())
            )
          )

        if (expiredKeyResult[0]) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'API key has expired',
          })
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        })
      }

      apiKeyRecord = apiKeyResult[0]

      // Update last used timestamp
      await ctx.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, apiKeyRecord.id))

      // Call the next middleware/procedure
      const result = await next({
        ctx: {
          ...ctx,
          auth: {
            userId: apiKeyRecord.userId,
          },
        },
      })
      return result
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
      statusCode = getStatusCode(e)
      throw e
    } finally {
      // Log the request
      if (apiKeyRecord) {
        const duration = Date.now() - startTime
        await ctx.db.insert(apiRequestLogs).values({
          apiKeyId: apiKeyRecord.id,
          userId: apiKeyRecord.userId,
          method: type,
          path,
          statusCode,
          requestBody: null,
          responseBody: null, // We don't log response bodies for privacy/security
          error,
          duration,
        })
      }
    }
  } else if (session?.user?.id) {
    const result = await next({
      ctx: {
        ...ctx,
        auth: {
          userId: session.user.id,
        },
      },
    })
    return result
  } else {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'API key or session is required',
    })
  }
})

// Export a protected procedure that requires either API key or session
export const protectedProcedure = t.procedure.use(authMiddleware)
