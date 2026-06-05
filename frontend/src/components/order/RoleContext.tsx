"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { safeJsonParse } from "@/lib/utils";

interface RoleContextValue {
  isSeller: boolean;
  isAdmin: boolean;
  isLogistics: boolean;
  setIsSeller: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsAdmin: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsLogistics: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const RoleContext = createContext<RoleContextValue>({
  isSeller: false,
  isAdmin: false,
  isLogistics: false,
  setIsSeller: () => {},
  setIsAdmin: () => {},
  setIsLogistics: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogistics, setIsLogistics] = useState(false);
  const [roleMounted, setRoleMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      if (raw) {
        const user = safeJsonParse<{ account_type?: string; role?: string } | null>(raw, null);
        if (user?.account_type) setIsSeller(user.account_type === "seller");
        if (user?.role) {
          setIsAdmin(user.role === "admin");
          setIsLogistics(user.role === "logistics");
        }
      }
    } catch (e) {
      console.error("RoleProvider init error:", e);
    } finally {
      setRoleMounted(true);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ isSeller, isAdmin, isLogistics, setIsSeller, setIsAdmin, setIsLogistics }}>
      {roleMounted ? children : null}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
