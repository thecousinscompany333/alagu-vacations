import { Suspense } from "react";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { fetchAdminDirectory } from "@/lib/admin-users";
import { AddAdminForm } from "./AddAdminForm";

export default function AdminUsersPage() {
  return (
    <>
      <PageTitle
        title="Admin users"
        text="People who can sign in to this dashboard. New accounts can use forgot password after sign-up is disabled in Supabase."
      />
      <Suspense fallback={<LoadingBlock label="Loading admin users" />}>
        <UsersContent />
      </Suspense>
    </>
  );
}

async function UsersContent() {
  const { user } = await requireSuperAdmin();
  const directory = await fetchAdminDirectory();

  if (!directory.ok && directory.reason === "missing_service_role") {
    return (
      <Card>
        <p className="text-sm text-amber-900">
          Adding admins from the portal needs{" "}
          <code className="rounded bg-amber-100 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> on the server (Render →
          Environment). It is never exposed to the browser. Until then, run{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">scripts/create-admin.mjs</code> on your machine.
        </p>
      </Card>
    );
  }

  if (!directory.ok) {
    return (
      <Card>
        <p className="text-sm text-red-700">Could not load admin users. Refresh or try again.</p>
      </Card>
    );
  }

  const { admins } = directory;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-lg font-semibold text-navy-900">Current users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.userId} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    {a.email}
                    {a.userId === user.id ? (
                      <span className="ml-2 text-xs text-slate-500">(you)</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{a.role === "super_admin" ? "Super admin" : a.role === "partner" ? `Partner · ${a.businessName ?? "—"}` : "Admin"}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-navy-900">Add user</h2>
        <p className="mt-1 text-sm text-slate-600">
          Share the email and temporary password securely. Supabase sign-up stays off for the public. Partners are vehicle
          owners: they only see enquiries for vehicles you assign to them.
        </p>
        <div className="mt-4">
          <AddAdminForm />
        </div>
      </Card>
    </div>
  );
}