"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client"; // Asegúrate de tener este cliente

interface UserContextValue {
  user: User | null;
  simulatedRole: string | null;
  setSimulatedRole: (role: string | null) => void;
  effectiveRole: string;
  realRole: string;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  simulatedRole: null,
  setSimulatedRole: () => {},
  effectiveRole: "user",
  realRole: "user",
});

export function UserProvider({
  user: initialUser,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const effectiveRole = simulatedRole || realRole;

  return (
    <UserContext.Provider value={{ user, simulatedRole, setSimulatedRole, effectiveRole, realRole }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  return ctx.user;
};

export const useUserContext = () => {
  return useContext(UserContext);
};
