import { SignOutButton } from "@/components/SignOutButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-instrument gap-4">
      <h1 className="text-4xl font-bold"> <i>Welcome to Trackwise</i></h1>
      <SignOutButton />
    </div>
  );
}
