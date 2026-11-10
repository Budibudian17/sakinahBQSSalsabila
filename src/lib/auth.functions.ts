import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  pendidikan: z.string().trim().optional(),
  rt: z.string().trim().optional(),
});

async function adminExists() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) {
    console.error("[Supabase] Gagal memeriksa data pengurus:", error);
    throw new Error("Gagal memeriksa data pengurus");
  }
  return (count ?? 0) > 0;
}

async function createAccount(data: z.infer<typeof accountSchema>, role: "admin" | "santri" | "guru") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  });
  if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat akun");

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: data.fullName,
      email: data.email,
      pendidikan: data.pendidikan || null,
      rt: data.rt || null,
    })
    .eq("id", created.user.id);
  if (profileError) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (cleanupError) console.error("[Supabase] Gagal membersihkan akun setelah profil gagal disimpan:", cleanupError);
    throw new Error("Akun dibuat, tetapi data profil gagal disimpan");
  }

  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role });
  if (roleError) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (cleanupError) console.error("[Supabase] Gagal membersihkan akun setelah role gagal disimpan:", cleanupError);
    throw new Error("Akun dibuat, tetapi peran gagal disimpan");
  }
  return { id: created.user.id };
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => ({
  needsSetup: !(await adminExists()),
}));

export const setupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => accountSchema.parse(d))
  .handler(async ({ data }) => {
    if (await adminExists()) throw new Error("Akun pengurus sudah ada");
    return createAccount(data, "admin");
  });

export const createSantriAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => accountSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error) throw new Error("Gagal memverifikasi akses pengurus");
    if (!isAdmin) throw new Error("Hanya pengurus yang dapat menambah santri");
    return createAccount(data, "santri");
  });
