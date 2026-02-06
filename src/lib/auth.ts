// src/lib/auth.ts
import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "wm_access_token";
const REFRESH_KEY = "wm_refresh_token";

export interface AuthUser {
  id: string;
  email: string;
  role: "read_only" | "interactive";
  isAdmin: boolean;
  forcePasswordChange: boolean;
}

export interface Permissions {
  canView: boolean;
  canSwitchTabs: boolean;
  canUseFilters: boolean;
  canExport: boolean;
  canManageUsers: boolean;
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function getClaimsFromToken(token: string | null): (Record<string, unknown> & { permissions: Permissions }) | null {
  if (!token) return null;
  const claims = parseJwt(token);
  if (!claims) return null;
  // Check expiry
  const exp = claims.exp as number;
  if (exp && exp * 1000 < Date.now()) return null;
  return claims as any;
}

async function callEdge(fnName: string, body: Record<string, unknown>, authToken?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  
  const { data, error } = await supabase.functions.invoke(fnName, {
    body,
    headers,
  });
  
  return data;
}

export async function seedAdmin() {
  return callEdge("auth", { action: "seed-admin" });
}

export async function login(email: string, password: string) {
  const data = await callEdge("auth", { action: "login", email, password });
  if (data?.error) throw new Error(data.error);
  if (data?.accessToken) {
    storeTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function refreshSession() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;
  
  const data = await callEdge("auth", { action: "refresh", refreshToken });
  if (data?.error) {
    clearTokens();
    return null;
  }
  if (data?.accessToken) {
    storeTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("auth", { action: "change-password", currentPassword, newPassword }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  if (data?.accessToken) {
    storeTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function logout() {
  const { accessToken } = getStoredTokens();
  try {
    await callEdge("auth", { action: "logout" }, accessToken ?? undefined);
  } finally {
    clearTokens();
  }
}

// Admin API calls
export async function adminListUsers() {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("admin", { action: "list-users" }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  return data.users;
}

export async function adminCreateUser(email: string, role: string) {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("admin", { action: "create-user", email, role }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function adminResetPassword(userId: string) {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("admin", { action: "reset-password", userId }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function adminToggleActive(userId: string, isActive: boolean) {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("admin", { action: "toggle-active", userId, isActive }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function adminChangeRole(userId: string, newRole: string) {
  const { accessToken } = getStoredTokens();
  const data = await callEdge("admin", { action: "change-role", userId, newRole }, accessToken ?? undefined);
  if (data?.error) throw new Error(data.error);
  return data;
}
