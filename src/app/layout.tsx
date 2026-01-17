"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load initial state from localStorage
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === "true");
    }

    const savedWidth = localStorage.getItem("sidebar-width");
    if (savedWidth !== null) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }

    // Listen for sidebar toggle events
    const handleSidebarToggle = (event: CustomEvent<{ isCollapsed: boolean; width: number }>) => {
      setIsSidebarCollapsed(event.detail.isCollapsed);
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
    };
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = "matches" in event ? event.matches : (event as MediaQueryList).matches;
      if (!localStorage.getItem("theme")) {
        const nextTheme = matches ? "dark" : "light";
        setTheme(nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }
    };

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // @ts-expect-error - Legacy Safari support
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if ("addEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // @ts-expect-error - Legacy Safari support
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      localStorage.setItem("theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      return nextTheme;
    });
  };

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
        <Header
          sidebarOffset={isSidebarCollapsed ? 64 : sidebarWidth}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main
          className="mt-16 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300"
          style={{
            marginLeft: isSidebarCollapsed ? "64px" : `${sidebarWidth}px`,
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
