import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { upsertUser } from "@/database";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
    const { userId } = await auth();
    const client = await clerkClient();
    if (userId && ["/signed-in", "/signed-up"].includes(req.nextUrl.pathname)) {
      await upsertUser(await client.users.getUser(userId));
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  },
  {
    debug: process.env.NODE_ENV === "development",
    authorizedParties:
      process.env.NODE_ENV === "development"
        ? ["https://mitama.io", "http://localhost:3000"]
        : ["https://mitama.io"],
  },
);

// Routes Middleware should not run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
