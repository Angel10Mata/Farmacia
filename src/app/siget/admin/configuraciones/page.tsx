import { Suspense } from "react";

import AppConfiguraciones from "@/components/(base)/(settings)/index";
export default function ConfiguracionesPage() {
  return (
    <Suspense>
      <AppConfiguraciones />
    </Suspense>
  );
}
