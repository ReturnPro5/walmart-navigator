import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  adminListUsers,
  adminCreateUser,
  adminResetPassword,
  adminToggleActive,
  adminChangeRole,
} from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { UserPlus, KeyRound, Ban, CheckCircle, ArrowLeft } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  force_password_change: boolean;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("read_only");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Guard: must be admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await adminListUsers();
      setUsers(list);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    try {
      await adminCreateUser(newEmail, newRole);
      setCreateSuccess(`User ${newEmail} created with default password "Password1"`);
      setNewEmail("");
      setNewRole("read_only");
      await loadUsers();
    } catch (e: any) {
      setCreateError(e.message);
    }
  }

  async function handleResetPassword(userId: string) {
    setActionLoading(userId + "-reset");
    try {
      await adminResetPassword(userId);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    setActionLoading(userId + "-toggle");
    try {
      await adminToggleActive(userId, !currentlyActive);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangeRole(userId: string, currentRole: string) {
    const newRole = currentRole === "read_only" ? "interactive" : "read_only";
    setActionLoading(userId + "-role");
    try {
      await adminChangeRole(userId, newRole);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => {
        if (tab !== "admin") navigate("/dashboard");
        setActiveTab(tab);
      }} />
      <main className="flex-1 ml-64 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Create, manage, and control user access.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
        )}

        {/* Create user card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="flex items-end gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-[250px]">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2 w-[180px]">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read_only">Read Only</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </form>
            {createError && (
              <div className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-md">{createError}</div>
            )}
            {createSuccess && (
              <div className="mt-3 text-sm text-[hsl(var(--metric-positive))] bg-[hsl(var(--metric-positive)/0.1)] p-3 rounded-md">{createSuccess}</div>
            )}
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading users…</div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password Change</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const isAdminUser = u.email.toLowerCase() === user?.email.toLowerCase() && user?.isAdmin;
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-sm">
                            {u.email}
                            {isAdminUser && (
                              <Badge className="ml-2 bg-primary/10 text-primary text-xs">Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === "interactive" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_active ? "default" : "destructive"}>
                              {u.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.force_password_change ? (
                              <span className="text-xs text-[hsl(var(--risk-medium))]">Required</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {!isAdminUser && (
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResetPassword(u.id)}
                                  disabled={actionLoading === u.id + "-reset"}
                                >
                                  <KeyRound className="w-3 h-3 mr-1" />
                                  Reset PW
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(u.id, u.is_active)}
                                  disabled={actionLoading === u.id + "-toggle"}
                                >
                                  {u.is_active ? (
                                    <><Ban className="w-3 h-3 mr-1" />Revoke</>
                                  ) : (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Restore</>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChangeRole(u.id, u.role)}
                                  disabled={actionLoading === u.id + "-role"}
                                >
                                  → {u.role === "read_only" ? "Interactive" : "Read Only"}
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
