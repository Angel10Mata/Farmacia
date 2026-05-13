import { Suspense } from "react";

import { VerUsuarios } from "@/components/(base)/(users)/usuarios/VerUsuarios";
export default function SignupPage() {
  return (
    <Suspense>
      <VerUsuarios />
    </Suspense>
  );
}
