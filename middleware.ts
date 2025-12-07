import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Define public routes that don't require authentication
  const isPublicPath = request.nextUrl.pathname === "/";
  const isOnboardingPath = request.nextUrl.pathname.startsWith("/onboarding");
  const isDashboardPath = request.nextUrl.pathname.startsWith("/dashboard");
  
  // Check if user has selected currency
  const hasCurrency = request.cookies.has('userCurrency');

  // If the user is on a public path and is authenticated
  if (isPublicPath && isAuthenticated) {
    // If they haven't selected currency, send to onboarding
    if (!hasCurrency) {
      return NextResponse.redirect(new URL("/onboarding/currency", request.url));
    }
    // Otherwise send to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is on dashboard but hasn't selected currency, redirect to onboarding
  if (isDashboardPath && isAuthenticated && !hasCurrency) {
    return NextResponse.redirect(new URL("/onboarding/currency", request.url));
  }

  // If the user is on a protected path and is not authenticated, redirect to home
  if ((!isPublicPath && !isOnboardingPath) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Prevent authenticated users without currency from accessing dashboard
  // Allow access to onboarding paths when authenticated

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/", "/dashboard/:path*", "/onboarding/:path*"],
};
