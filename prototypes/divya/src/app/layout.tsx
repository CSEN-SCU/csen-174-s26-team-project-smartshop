import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartShop — Find the Best Grocery Deals Near You",
  description: "Compare grocery prices across nearby stores and find the best deal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
