import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    let avatarUrl: string | null = null;
    if (profile?.avatar_url) {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
      avatarUrl = data?.signedUrl ?? null;
    }
    return {
      id: user.id,
      email: profile?.email || user.email || "",
      fullName: profile?.full_name || "Santri",
      avatarPath: profile?.avatar_url ?? null,
      avatarUrl,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  },
});

export const useMe = () => useQuery(meQuery);

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "S";
