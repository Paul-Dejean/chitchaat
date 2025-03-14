"use client";
import { store } from "@/store";
import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from "react-redux";
import "./globals.css";

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
  return (
    <Provider store={store}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
        >
          {children}
        </body>
      </html>
    </Provider>
  );
}
