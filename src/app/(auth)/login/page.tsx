import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    // LoginForm reads `?next=` via useSearchParams, which needs a Suspense boundary.
    <Suspense fallback={<Skeleton className="h-[380px] w-full rounded-xl bg-zinc-900" />}>
      <LoginForm />
    </Suspense>
  );
}
