import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Blog | ShipKit - No BS AI Development Insights",
  description: "Real insights on AI development, vibe coding, and building software faster. Learn from actual experiences, case studies, and hard lessons. No fluff. No corporate speak.",
  keywords: "vibe coding blog, AI development, software development 2025, coding with AI, building in public, case studies, scam alerts",
  alternates: {
    canonical: "https://shipkit.io/blog"
  },
  openGraph: {
    title: "Blog | ShipKit",
    description: "No BS insights on AI development. Real results. Hard lessons. I got scammed so you don't have to.",
    type: "website",
    url: "https://shipkit.io/blog"
  }
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>
      {children}
    </>
  );
}
