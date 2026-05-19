import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Similar alternatives — SmartShop",
  description: "Find similar product alternatives with OpenAI.",
};

export default function SimilarAlternativesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
