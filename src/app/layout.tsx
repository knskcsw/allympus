"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    }

    // Listen for sidebar toggle events
    const handleSidebarToggle = (event: CustomEvent<{ isCollapsed: boolean }>) => {
      setIsSidebarCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
    };
  }, []);

  return (
    <html lang="ja">
      <head>
        <title>Allympus</title>
        <meta name="description" content="Work management and task tracking application" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Sidebar />
        <Header />
        <main className={cn(
          "mt-16 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300",
          isSidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          {children}
        </main>
      </body>
    </html>
  );
}
