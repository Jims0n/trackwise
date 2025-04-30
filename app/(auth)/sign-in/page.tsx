'use client'
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1C1C] px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Logo/Brand */}
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-white">recoin.</h1>
          <p className="text-lg text-gray-400">
            Take control of your financial life.
          </p>
        </div>

        {/* Sign in Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-[#F8F7F4] hover:bg-[#E8E7E4] text-black"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <Image
            src="/google.svg"
            alt="Google"
            width={20}
            height={20}
            className="mr-2"
          />
          Continue with Google
        </Button>
      </div>
    </div>
  );
}