import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

async function adminExists() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error("Gagal memeriksa data pengurus");
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
  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role });
  if (roleError) throw new Error("Akun dibuat, tetapi peran gagal disimpan");
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
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Hanya pengurus yang dapat menambah santri");
    return createAccount(data, "santri");
  });
