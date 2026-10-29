import { redirect } from "next/navigation";
import { optionalEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured =
    optionalEnv("NEXT_PUBLIC_SUPABASE_URL") !== null &&
    optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") !== null;

  if (!configured) {
    redirect("/login");
  }

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();

  redirect(data?.claims === undefined ? "/login" : "/dashboard");
}
