import { Suspense } from "react";
import Dashboard from "@/components/(SIGET)/dashboard";

export default function SIGETPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
