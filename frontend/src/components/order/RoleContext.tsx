"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

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
  return (
    <RoleContext.Provider value={{ isSeller, setIsSeller }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
