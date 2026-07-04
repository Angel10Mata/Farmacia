import { Suspense } from "react";
import { VerFinanzas } from "../../../components/(base)/finanzas/VerFinanzas";

export default function FinanzasPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8DA78E]"></div>
      </div>
    }>
      <VerFinanzas />
    </Suspense>
  );
}
