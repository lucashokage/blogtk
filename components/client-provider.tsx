"use client"

import type React from "react"

import { ThemeProvider } from "./theme-provider"

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
