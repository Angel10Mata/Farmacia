import { Suspense } from "react";

import AppSettings from "@/components/(base)/(settings)/index";
export default function SettingsPage() {
  return (
    <Suspense>
      <AppSettings />
    </Suspense>
  );
}
