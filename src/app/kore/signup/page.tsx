import { Suspense } from "react";
import SignupPageClient from "@/components/(base)/(auth)/signup/SignupPageClient";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageClient />
    </Suspense>
  );
}
