import { Suspense } from "react";

import { Dispositivos } from "@/components/(base)/(auth)/devices/index";
export default function SignupPage() {
  return (
    <Suspense>
      <Dispositivos />
    </Suspense>
  );
}
