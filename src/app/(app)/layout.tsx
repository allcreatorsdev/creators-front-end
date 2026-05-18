import { Sidebar } from "@/components/layout/Sidebar";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-350 px-8 py-8">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
