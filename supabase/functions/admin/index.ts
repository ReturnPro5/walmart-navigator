import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.2/index.ts";

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

const ADMIN_EMAIL = () => (Deno.env.get("ADMIN_EMAIL") ?? "").toLowerCase();

function getJwtKey() {
  return new TextEncoder().encode(Deno.env.get("JWT_SECRET")!);
}

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

async function verifyAdmin(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtKey(), {
      issuer: "wm-reverse-logistics-dashboard",
    });
    if (String(payload.email).toLowerCase() !== ADMIN_EMAIL()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function listUsers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, is_active, force_password_change, last_login_at, created_at, auth_provider")
    .order("created_at", { ascending: true });

  if (error) return json({ error: error.message }, 500);
  return json({ users: data });
}

async function createUser(email: string, role: string, actorId: string) {
  const supabase = getSupabase();

  if (!["read_only", "interactive"].includes(role)) return json({ error: "Invalid role" }, 400);
  if (email.toLowerCase() === ADMIN_EMAIL()) return json({ error: "Cannot create another admin" }, 403);

  const hash = await hashPassword("Password1");
  const { data, error } = await supabase.from("users").insert({
    email: email.toLowerCase(),
    password_hash: hash,
    role,
    force_password_change: true,
    is_active: true,
  }).select().single();

  if (error) {
    if (error.message.includes("duplicate")) return json({ error: "User already exists" }, 409);
    return json({ error: error.message }, 500);
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actorId, action: "user_created", target_user_id: data.id, metadata: { email, role },
  });

  return json({ user: data });
}

async function resetPassword(targetUserId: string, actorId: string) {
  const supabase = getSupabase();
  const hash = await hashPassword("Password1");

  const { error } = await supabase.from("users").update({
    password_hash: hash, force_password_change: true, failed_login_count: 0, locked_until: null,
  }).eq("id", targetUserId);

  if (error) return json({ error: error.message }, 500);

  await supabase.from("audit_logs").insert({
    actor_user_id: actorId, action: "password_reset", target_user_id: targetUserId,
  });

  return json({ message: "Password reset to default" });
}

async function toggleActive(targetUserId: string, isActive: boolean, actorId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", targetUserId);
  if (error) return json({ error: error.message }, 500);

  if (!isActive) {
    await supabase.from("refresh_tokens").update({ revoked_at: new Date().toISOString() })
      .eq("user_id", targetUserId).is("revoked_at", null);
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actorId, action: isActive ? "user_restored" : "user_revoked", target_user_id: targetUserId,
  });

  return json({ message: isActive ? "Access restored" : "Access revoked" });
}

async function changeRole(targetUserId: string, newRole: string, actorId: string) {
  const supabase = getSupabase();
  if (!["read_only", "interactive"].includes(newRole)) return json({ error: "Invalid role" }, 400);

  const { data: targetUser } = await supabase.from("users").select("email").eq("id", targetUserId).maybeSingle();
  if (targetUser && targetUser.email.toLowerCase() === ADMIN_EMAIL()) {
    return json({ error: "Cannot change admin role" }, 403);
  }

  const { error } = await supabase.from("users").update({ role: newRole }).eq("id", targetUserId);
  if (error) return json({ error: error.message }, 500);

  await supabase.from("audit_logs").insert({
    actor_user_id: actorId, action: "role_changed", target_user_id: targetUserId, metadata: { newRole },
  });

  return json({ message: "Role updated" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const claims = await verifyAdmin(req.headers.get("authorization"));
  if (!claims) return json({ error: "Forbidden - admin access required" }, 403);

  try {
    const { action, ...params } = await req.json();
    const actorId = claims.sub as string;

    switch (action) {
      case "list-users": return await listUsers();
      case "create-user": return await createUser(params.email, params.role, actorId);
      case "reset-password": return await resetPassword(params.userId, actorId);
      case "toggle-active": return await toggleActive(params.userId, params.isActive, actorId);
      case "change-role": return await changeRole(params.userId, params.newRole, actorId);
      default: return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
