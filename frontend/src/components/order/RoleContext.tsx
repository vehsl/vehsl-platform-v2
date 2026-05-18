"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface RoleContextValue {
  isSeller: boolean;
  setIsSeller: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const RoleContext = createContext<RoleContextValue>({
  isSeller: false,
  setIsSeller: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isSeller, setIsSeller] = useState(false);
  const [roleMounted, setRoleMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      if (raw) {
        const user = JSON.parse(raw) as { account_type?: string } | null;
        if (user?.account_type) setIsSeller(user.account_type === "seller");
      }
    } catch (e) {
      console.error("RoleProvider init error:", e);
    } finally {
      setRoleMounted(true);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ isSeller, setIsSeller }}>
      {roleMounted ? children : null}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
