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
