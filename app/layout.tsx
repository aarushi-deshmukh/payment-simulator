"use client";

import "./globals.css";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideHeader =
    pathname === "/signin" ||
    pathname === "/signup";

  return (
    <html lang="en">
      <body className="bg-white text-black">
        {!hideHeader && <Header />}
        <main>{children}</main>
      </body>
    </html>
  );
}
