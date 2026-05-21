import { Suspense } from "react";
import { Dispositivos } from "@/components/(base)/(auth)/devices/index";

export default function SignupPage() {
  return (
    <Suspense>
      <div className="w-full p-4 pt-28 md:p-6 md:pt-24">
        <Dispositivos />
      </div>
    </Suspense>
  );
}
