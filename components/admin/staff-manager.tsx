"use client";

import { FormEvent, Fragment, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  active: boolean;
  createdAt: string;
};

export function StaffManager({ initial }: { initial: StaffUser[] }) {
  const [users, setUsers] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "STAFF">("STAFF");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const payload = (await adminFetch("/api/admin/staff")) as { users: StaffUser[] };
    setUsers(payload.users);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await adminFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      await refresh();
      setMessage("Admin user created. They can sign in at /admin/login with this email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create user");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    setPending(true);
    setMessage("");
    try {
      await adminFetch(`/api/admin/staff/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update user");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(user: StaffUser, event: FormEvent) {
    event.preventDefault();
    if (resetPasswordValue.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await adminFetch(`/api/admin/staff/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      setResetFor(null);
      setResetPasswordValue("");
      setMessage(`Password updated for ${user.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setPending(false);
    }
  }

  async function remove(user: StaffUser) {
    if (!window.confirm(`Delete admin user ${user.email}?`)) {
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await adminFetch(`/api/admin/staff/${user.id}`, { method: "DELETE" });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete user");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form method="post" onSubmit={onCreate} className="max-w-xl space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Add admin user</h2>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <label className="block text-sm text-slate-600">
          Role
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value as "OWNER" | "STAFF")}
          >
            <option value="STAFF">Staff</option>
            <option value="OWNER">Owner</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create admin user"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  No named admin users yet. Sign in with the desk API key, then create the first
                  owner here.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <Fragment key={user.id}>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.active ? "Active" : "Disabled"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-2 text-xs font-semibold text-navy"
                      onClick={() => toggleActive(user)}
                    >
                      {user.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="mr-2 text-xs font-semibold text-navy"
                      onClick={() => {
                        setResetFor(user.id);
                        setResetPasswordValue("");
                        setMessage("");
                      }}
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-700"
                      onClick={() => remove(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {resetFor === user.id ? (
                  <tr>
                    <td colSpan={5} className="bg-slate-50 px-4 py-3">
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(event) => resetPassword(user, event)}
                      >
                        <label className="min-w-56 flex-1 text-xs font-medium text-slate-600">
                          New password for {user.email}
                          <input
                            type="password"
                            minLength={8}
                            required
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            value={resetPasswordValue}
                            onChange={(event) => setResetPasswordValue(event.target.value)}
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-xl bg-gold px-3 py-2 text-xs font-bold text-navy"
                        >
                          Save password
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                          onClick={() => {
                            setResetFor(null);
                            setResetPasswordValue("");
                          }}
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
