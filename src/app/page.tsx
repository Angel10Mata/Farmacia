import { Suspense } from "react";
import LoginForm from "@/components/(base)/(auth)/login/LogIn";

export default function Home() {
  return (
    <div className="text-foreground flex-1 flex flex-col">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
