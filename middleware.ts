import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Define public routes that don't require authentication
  const isPublicPath = request.nextUrl.pathname === "/";

  // If the user is on a public path and is authenticated, redirect to dashboard
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is on a protected path and is not authenticated, redirect to home
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
