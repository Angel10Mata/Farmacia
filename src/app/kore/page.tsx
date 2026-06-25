import { Suspense } from "react";

import { Dashboard } from "@/components/(base)/dashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

