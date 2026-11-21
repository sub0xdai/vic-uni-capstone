import { confirmReason } from "@/lib/confirm";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm reason={confirmReason(params.reason ?? null)} />;
}
