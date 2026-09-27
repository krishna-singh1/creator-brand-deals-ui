"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Input, PageTitle, Select, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";

import { AdminTable, ReasonAction, useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

type AdminUser = components["schemas"]["AdminUser"];
type Role = components["schemas"]["Role"];
type UserStatus = components["schemas"]["UserStatus"];

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <Users />
    </AdminShell>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const list = useCursorList(["admin", "users", search, role, status], (cursor) =>
    unwrap(
      api.GET("/admin/users", {
        params: { query: { q: search || undefined, role: role || undefined, status: status || undefined, cursor, limit: 25 } },
      }),
    ),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Users" subtitle="Find anyone by email, creator name or handle, or brand name." />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <Input className="w-72" placeholder="Email, name or handle" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-36" aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
          <option value="">All roles</option>
          <option value="CREATOR">Creators</option>
          <option value="BRAND">Brands</option>
          <option value="ADMIN">Admins</option>
        </Select>
        <Select className="w-36" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as UserStatus | "")}>
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </Select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <AdminTable
        headers={["User", "Role", "Status", "Last sign-in", "Joined", ""]}
        empty={list.items.length === 0}
        loading={list.isPending}
        hasMore={!!list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
      >
        {list.items.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </AdminTable>
    </div>
  );
}

function UserRow({ user: u }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  const path = { params: { path: { userId: u.id } } };
  const suspend = useMutation({
    mutationFn: (reason: string) => unwrap(api.POST("/admin/users/{userId}/suspend", { ...path, body: { reason } })),
    onSuccess: refresh,
  });
  const reinstate = useMutation({ mutationFn: () => unwrap(api.POST("/admin/users/{userId}/unsuspend", path)), onSuccess: refresh });

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{u.displayName ?? "—"}</div>
        <div className="text-zinc-500">{u.email}</div>
      </td>
      <td className="px-4 py-3">
        {u.role ? u.role.toLowerCase() : "not chosen"}
        {u.creatorStatus && (
          <div className="mt-1">
            <StatusBadge status={u.creatorStatus} />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={u.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(u.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        {u.status === "ACTIVE" && u.role !== "ADMIN" && (
          <ReasonAction
            label="Suspend"
            confirmLabel="Suspend account"
            prompt="Why are you suspending this account?"
            pending={suspend.isPending}
            error={suspend.error}
            onConfirm={(reason) => suspend.mutate(reason)}
          />
        )}
        {u.status === "SUSPENDED" && (
          <Button variant="secondary" className="h-8 px-3" disabled={reinstate.isPending} onClick={() => reinstate.mutate()}>
            Reinstate
          </Button>
        )}
      </td>
    </tr>
  );
}
