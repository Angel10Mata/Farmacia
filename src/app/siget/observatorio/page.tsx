import { Suspense } from "react";
import Dashboard from "@/components/(SIGET)/dashboard";

export default function SIGETMainPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
