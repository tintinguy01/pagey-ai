import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes (dashboard routes)
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Protect dashboard routes with Clerk authentication
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 