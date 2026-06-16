import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`dark ${inter.variable} ${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
