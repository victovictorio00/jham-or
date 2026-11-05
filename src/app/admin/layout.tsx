import { cookies } from "next/headers";
import { adminPage } from "@/lib/auth";
import { AdminShell } from "@/components/admin";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await adminPage();
  return (
    <AdminShell
      name={u.name}
      initialCollapsed={
        (await cookies()).get("jhamor_admin_sidebar")?.value === "compact"
      }
    >
      {children}
    </AdminShell>
  );
}
