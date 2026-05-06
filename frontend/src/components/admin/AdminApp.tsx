"use client";

import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BounceProvider } from "./BounceContext";

export function AdminApp() {
  return (
    <BounceProvider>
      <RouterProvider router={router} />
    </BounceProvider>
  );
}
