"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import Image from "next/image";

export function SignInButton() {
  const { data: session, status } = useSession();

  // Show a subtle loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center gap-4 opacity-70 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <Button
          variant="outline"
          size="sm"
          disabled
        >
          <span className="opacity-0">Loading</span>
        </Button>
      </div>
    );
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm">
          Signed in as <span className="font-semibold">{session.user.name}</span>
        </p>
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          variant="outline"
          size="sm"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("google")} className="w-full h-[50px] bg-[#FAFFED] hover:bg-[#E8E7E4] text-black cursor-pointer rounded-2xl" variant="outline">
      <Image
      src="/google.svg"
      alt="Google"
      width={24}
      height={24}
      className="mr-1"
      />
      Continue with Google
    </Button>
  );
}
