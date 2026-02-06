import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, jwtVerify } from "https://deno.land/x/jose@v5.2.2/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Password hashing using PBKDF2 (no Workers needed) ──
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const hashArr = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArr).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1]);
  const saltHex = parts[2];
  const hashHex = parts[3];
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256
  );
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === hashHex;
}

const ADMIN_EMAIL = () => (Deno.env.get("ADMIN_EMAIL") ?? "").toLowerCase();
const JWT_SECRET_RAW = () => Deno.env.get("JWT_SECRET")!;
const ACCESS_TOKEN_EXP = "15m";
const REFRESH_TOKEN_DAYS = 7;

function getJwtKey() {
  return new TextEncoder().encode(JWT_SECRET_RAW());
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  role: string;
  is_active: boolean;
  force_password_change: boolean;
  failed_login_count: number;
  locked_until: string | null;
}

function buildPermissions(role: string, isAdmin: boolean) {
  if (isAdmin) {
    return { canView: true, canSwitchTabs: true, canUseFilters: true, canExport: true, canManageUsers: true };
  }
  if (role === "interactive") {
    return { canView: true, canSwitchTabs: true, canUseFilters: true, canExport: true, canManageUsers: false };
  }
  return { canView: true, canSwitchTabs: true, canUseFilters: false, canExport: false, canManageUsers: false };
}

async function createAccessToken(user: UserRow) {
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL();
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    isAdmin,
    role: user.role,
    permissions: buildPermissions(user.role, isAdmin),
    forcePasswordChange: user.force_password_change,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("wm-reverse-logistics-dashboard")
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXP)
    .sign(getJwtKey());
}

async function createRefreshToken(userId: string) {
  const supabase = getSupabase();
  const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();
  const tokenHash = await hashPassword(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("refresh_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return rawToken;
}

async function verifyAccessToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtKey(), {
      issuer: "wm-reverse-logistics-dashboard",
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function seedAdmin() {
  const supabase = getSupabase();
  const adminEmail = ADMIN_EMAIL();
  const adminPassword = Deno.env.get("ADMIN_INITIAL_PASSWORD") ?? "VamosEquipo1!";

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .maybeSingle();

  if (existing) return { seeded: false, message: "Admin already exists" };

  const hash = await hashPassword(adminPassword);
  const { error } = await supabase.from("users").insert({
    email: adminEmail,
    password_hash: hash,
    role: "interactive",
    force_password_change: true,
    is_active: true,
  });

  if (error) return { seeded: false, error: error.message };
  return { seeded: true };
}

async function login(email: string, password: string) {
  const supabase = getSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !user) return json({ error: "Invalid credentials" }, 401);
  if (!user.is_active) return json({ error: "Account is deactivated" }, 403);

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return json({ error: "Account is temporarily locked. Try again later." }, 423);
  }

  if (!user.password_hash) return json({ error: "Password not set" }, 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const newCount = (user.failed_login_count || 0) + 1;
    const updates: Record<string, unknown> = { failed_login_count: newCount };
    if (newCount >= 5) {
      updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
    await supabase.from("users").update(updates).eq("id", user.id);
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "login_failed",
      metadata: { reason: "invalid_password", attempt: newCount },
    });
    return json({ error: "Invalid credentials" }, 401);
  }

  await supabase.from("users").update({
    failed_login_count: 0,
    locked_until: null,
    last_login_at: new Date().toISOString(),
  }).eq("id", user.id);

  const accessToken = await createAccessToken(user as UserRow);
  const refreshToken = await createRefreshToken(user.id);

  await supabase.from("audit_logs").insert({ actor_user_id: user.id, action: "login_success" });

  return json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.email.toLowerCase() === ADMIN_EMAIL(),
      forcePasswordChange: user.force_password_change,
    },
  });
}

async function refresh(rawRefreshToken: string) {
  const supabase = getSupabase();

  const { data: tokens } = await supabase
    .from("refresh_tokens")
    .select("*")
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());

  if (!tokens?.length) return json({ error: "Invalid refresh token" }, 401);

  let matchedToken = null;
  for (const t of tokens) {
    if (await verifyPassword(rawRefreshToken, t.token_hash)) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) return json({ error: "Invalid refresh token" }, 401);

  await supabase.from("refresh_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", matchedToken.id);

  const { data: user } = await supabase.from("users").select("*").eq("id", matchedToken.user_id).maybeSingle();
  if (!user || !user.is_active) return json({ error: "Account deactivated" }, 403);

  const accessToken = await createAccessToken(user as UserRow);
  const newRefreshToken = await createRefreshToken(user.id);

  return json({ accessToken, refreshToken: newRefreshToken });
}

async function changePasswordHandler(claims: Record<string, unknown>, currentPassword: string, newPassword: string) {
  const supabase = getSupabase();
  const userId = claims.sub as string;

  if (newPassword === "Password1") return json({ error: "New password cannot be 'Password1'" }, 400);
  if (newPassword.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
  if (!/[A-Z]/.test(newPassword)) return json({ error: "Must contain an uppercase letter" }, 400);
  if (!/[a-z]/.test(newPassword)) return json({ error: "Must contain a lowercase letter" }, 400);
  if (!/[0-9]/.test(newPassword)) return json({ error: "Must contain a number" }, 400);
  if (!/[^A-Za-z0-9]/.test(newPassword)) return json({ error: "Must contain a special character" }, 400);

  const { data: user } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (!user) return json({ error: "User not found" }, 404);

  if (user.password_hash) {
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) return json({ error: "Current password is incorrect" }, 401);
  }

  const hash = await hashPassword(newPassword);
  await supabase.from("users").update({ password_hash: hash, force_password_change: false }).eq("id", userId);
  await supabase.from("audit_logs").insert({ actor_user_id: userId, action: "password_changed" });

  const { data: updatedUser } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  const accessToken = await createAccessToken(updatedUser as UserRow);
  const refreshToken = await createRefreshToken(userId);

  return json({ accessToken, refreshToken, message: "Password changed successfully" });
}

async function logoutHandler(claims: Record<string, unknown>) {
  const supabase = getSupabase();
  const userId = claims.sub as string;

  await supabase.from("refresh_tokens").update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId).is("revoked_at", null);
  await supabase.from("audit_logs").insert({ actor_user_id: userId, action: "logout" });

  return json({ message: "Logged out" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (action === "seed-admin") return json(await seedAdmin());
    if (action === "login") return await login(params.email, params.password);
    if (action === "refresh") return await refresh(params.refreshToken);

    const claims = await verifyAccessToken(req.headers.get("authorization"));
    if (!claims) return json({ error: "Unauthorized" }, 401);

    if (action === "change-password") {
      return await changePasswordHandler(claims, params.currentPassword, params.newPassword);
    }
    if (action === "logout") return await logoutHandler(claims);
    if (action === "me") {
      const supabase = getSupabase();
      const { data: user } = await supabase.from("users").select("*").eq("id", claims.sub).maybeSingle();
      if (!user) return json({ error: "User not found" }, 404);
      return json({
        id: user.id, email: user.email, role: user.role,
        isAdmin: user.email.toLowerCase() === ADMIN_EMAIL(),
        forcePasswordChange: user.force_password_change,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
