import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Top Nav */}
      <header className="border-b border-border bg-base/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-white">
            Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-fsvc-text-secondary">
              {session.user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-fsvc-text-secondary hover:text-white transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
