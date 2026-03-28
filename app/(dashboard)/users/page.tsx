"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Users, Shield, Loader2, Calendar, Clock, Trash2 } from "lucide-react";
import type { User, UserRole } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_COMPLIANCE_API_URL || "http://localhost:8003";

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: "bg-primary/10 text-primary border-primary/20",
  Analyst: "bg-warning/10 text-warning border-warning/20",
  Reviewer: "bg-muted text-muted-foreground border-border",
};

// Mobile user card view
function MobileUserCard({ 
  u, 
  currentUser, 
  isUpdating,
  onRoleChange,
  onToggleEnabled,
  onDelete 
}: { 
  u: User; 
  currentUser: User | null;
  isUpdating: boolean;
  onRoleChange: (username: string, role: UserRole) => void;
  onToggleEnabled: (username: string, enabled: boolean) => void;
  onDelete: (username: string) => void;
}) {
  const isSelf = u.username === currentUser?.username;
  
  return (
    <div className={cn(
      "p-4 border border-border rounded-xl bg-card space-y-4",
      isUpdating && "opacity-60"
    )}>
      {/* User header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {u.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{u.username}</span>
              {(u as any).online && (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Online" />
              )}
              {isSelf && (
                <Badge variant="outline" className="text-xs border-primary/20 text-primary shrink-0">
                  You
                </Badge>
              )}
            </div>
            <Badge className={cn("text-xs mt-1", ROLE_COLORS[u.role])}>
              {u.role}
            </Badge>
          </div>
        </div>
        <Badge
          className={cn(
            "text-xs shrink-0",
            u.enabled
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-red-100 text-red-700 border-red-200"
          )}
        >
          {u.enabled ? "Active" : "Disabled"}
        </Badge>
      </div>
      
      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Created: {new Date(u.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Last login: {u.lastLogin || (u as any).last_login
            ? new Date((u.lastLogin || (u as any).last_login) as string).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never"}</span>
        </div>
      </div>
      
      {/* Actions */}
      {!isSelf && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          <Select
            value={u.role}
            onValueChange={(v) => onRoleChange(u.username, v as UserRole)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Analyst">Analyst</SelectItem>
              <SelectItem value="Reviewer">Reviewer</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={u.enabled}
              onCheckedChange={(checked) => onToggleEnabled(u.username, checked)}
              disabled={isUpdating}
            />
            <span className="text-xs text-muted-foreground">
              {u.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(u.username)}
            disabled={isUpdating}
            className="ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Analyst");
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== "Admin") {
      setLoading(false);
      return;
    }
  
    try {
      const token = localStorage.getItem("access_token");
  
      const res = await fetch(`${BACKEND_URL}/users`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
  
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch {
      toast.error("Network error fetching users");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchUsers();
    } else if (currentUser) {
      setLoading(false);
    }
  }, [fetchUsers, currentUser]);

  async function handleRoleChange(username: string, newRole: UserRole) {
    setUpdatingUser(username);
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${BACKEND_URL}/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ username, role: newRole }),
      });
      if (res.ok) {
        toast.success(`Role updated to ${newRole} for ${username}`);
        await fetchUsers();
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingUser(null);
    }
  }

  async function handleToggleEnabled(username: string, enabled: boolean) {
    setUpdatingUser(username);
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${BACKEND_URL}/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ username, enabled }),
      });
      if (res.ok) {
        toast.success(
          `${username} ${enabled ? "enabled" : "disabled"} successfully`
        );
        await fetchUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingUser(null);
    }
  }

  async function handleCreateUser() {
    if (!newUsername) {
      toast.error("Username (email) is required");
      return;
    }
  
    setCreatingUser(true);
  
    try {
      const token = localStorage.getItem("access_token");
  
      const res = await fetch(`${BACKEND_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          username: newUsername,
          role: newRole,
        }),
      });
  
      if (res.ok) {
        toast.success(`User ${newUsername} created`);
        setNewUsername("");
        setNewRole("Analyst");
        fetchUsers();
      } else {
        toast.error("Failed to create user");
      }
  
    } catch {
      toast.error("Network error");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleDeleteUser(username: string) {
    if (!confirm(`Delete user ${username}?`)) return;

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${BACKEND_URL}/users/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.ok) {
        toast.success(`${username} deleted`);
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch {
      toast.error("Network error");
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Only administrators can manage system users.
        </p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user roles and access permissions. Changes take effect immediately.
        </p>
      </div>
      
      {/* Add User Card */}
      {currentUser?.role === "Admin" && (
        <Card className="glass-card border border-border bg-card">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-medium">
              Add New User
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 md:p-6 pt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Username</label>
                <input
                  className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="john.doe"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Role</label>
                <Select
                  value={newRole}
                  onValueChange={(v) => setNewRole(v as UserRole)}
                >
                  <SelectTrigger className="h-10 bg-background border border-border shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Analyst">Analyst</SelectItem>
                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="h-10"
              >
                {creatingUser ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Users List Card */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="pb-2 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                No users found. Users will appear once they log in.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile view - Card list */}
              <div className="md:hidden p-3 space-y-3">
                {users.map((u) => (
                  <MobileUserCard
                    key={u.id}
                    u={u}
                    currentUser={currentUser}
                    isUpdating={updatingUser === u.username}
                    onRoleChange={handleRoleChange}
                    onToggleEnabled={handleToggleEnabled}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </div>
              
              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/60">
                      <TableHead className="text-muted-foreground">Username</TableHead>
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Created</TableHead>
                      <TableHead className="text-muted-foreground">Last Login</TableHead>
                      <TableHead className="text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const isSelf = u.username === currentUser?.username;
                      const isUpdating = updatingUser === u.username;

                      return (
                        <TableRow
                          key={u.id}
                          className={cn(
                            "border-b border-border transition-colors hover:bg-muted/50",
                            isUpdating ? "opacity-60" : ""
                          )}
                        >
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{u.username}</span>

                                {(u as any).online && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-green-500"
                                    title="Online"
                                  />
                                )}
                              </div>
                              {isSelf && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-primary/20 text-primary"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isSelf ? (
                              <Badge className={cn("text-xs", ROLE_COLORS[u.role])}>
                                {u.role}
                              </Badge>
                            ) : (
                              <Select
                                value={u.role}
                                onValueChange={(v) =>
                                  handleRoleChange(u.username, v as UserRole)
                                }
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-28 h-8 bg-background border border-border shadow-sm text-foreground text-xs [&>span]:text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground">
                                  <SelectItem value="Admin">Admin</SelectItem>
                                  <SelectItem value="Analyst">Analyst</SelectItem>
                                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs",
                                u.enabled
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                              )}
                            >
                              {u.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {u.lastLogin || (u as any).last_login
                              ? new Date((u.lastLogin || (u as any).last_login) as string).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={u.enabled}
                                  onCheckedChange={(checked) =>
                                    handleToggleEnabled(u.username, checked)
                                  }
                                  disabled={isUpdating}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {u.enabled ? "Enabled" : "Disabled"}
                                </span>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.username)}
                                  disabled={isUpdating}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
