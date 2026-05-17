import { createClerkClient } from '@clerk/backend'

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) return next()

  if (!env.CLERK_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })

  try {
    const requestState = await clerk.authenticateRequest(request, {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      authorizedParties: ['http://localhost:5173', 'https://ddsr-dashboard.pages.dev', 'https://dashboards.datadrivensr.com'],
    })

    if (!requestState.isSignedIn) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    return next()
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }
}
