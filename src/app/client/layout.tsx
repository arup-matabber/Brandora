import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Review — Opalite",
  description: "Your creative direction review, presented by your designer.",
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#191918]">
      {children}
    </div>
  );
}
