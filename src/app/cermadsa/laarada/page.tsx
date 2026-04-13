import { Suspense } from "react";
import DashboardLaArada from "@/components/(LaArada)/dashboard";

export default function LaAradaPage() {
  return (
    <Suspense>
      <DashboardLaArada />
    </Suspense>
  );
}
