import Navigation from '../components/Navigation';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <div className="noise"></div>
      <div className="grid-overlay"></div>
      {children}
    </>
  );
}
