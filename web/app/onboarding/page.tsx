"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Card } from "@/components/ui";
import { parseBusinessProfile } from "@/lib/rows";
import { validateProfileDraft } from "@/lib/profile";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import {
  err,
  ok,
  type BusinessProfile,
  type BusinessProfileDraft,
  type Result,
} from "@/lib/types";

function draftOf(profile: BusinessProfile | null): BusinessProfileDraft | null {
  if (profile === null) {
    return null;
  }
  return {
    businessName: profile.businessName,
    industry: profile.industry,
    description: profile.description,
    targetAudience: profile.targetAudience,
    brandTone: profile.brandTone,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<Result<BusinessProfile | null>> => {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      return err(client.error);
    }
    const supabase = client.value;
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError !== null) {
      return err(authError.message);
    }
    if (auth.user === null) {
      return err("You must be logged in to manage a profile");
    }

    const { data, error } = await supabase
      .from("business_profile")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error !== null) {
      return err(`Could not load the profile: ${error.message}`);
    }
    if (data === null) {
      return ok(null);
    }
    const parsed = parseBusinessProfile(data);
    return parsed.ok ? ok(parsed.value) : err(parsed.error);
  }, []);

  useEffect(() => {
    let active = true;
    void load().then((result) => {
      if (!active) {
        return;
      }
      setLoading(false);
      if (result.ok) {
        setProfile(result.value);
        return;
      }
      setMessage(result.error);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const onSave = useCallback(
    async (form: FormData): Promise<Result<null>> => {
      const client = supabaseBrowserResult();
      if (!client.ok) {
        return err(client.error);
      }
      const supabase = client.value;
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError !== null) {
        return err(authError.message);
      }
      if (auth.user === null) {
        return err("You must be logged in to save a profile");
      }

      const check = validateProfileDraft(form);
      if (check.kind === "invalid") {
        return err(check.errors.businessName ?? "The profile form is incomplete");
      }

      const { error } = await supabase.from("business_profile").upsert(
        {
          user_id: auth.user.id,
          business_name: check.draft.businessName,
          industry: check.draft.industry,
          description: check.draft.description,
          target_audience: check.draft.targetAudience,
          brand_tone: check.draft.brandTone,
        },
        { onConflict: "user_id" },
      );

      if (error !== null) {
        return err(`Could not save the profile: ${error.message}`);
      }

      const reloaded = await load();
      if (reloaded.ok) {
        setProfile(reloaded.value);
      }
      setMessage("Profile saved");
      return ok(null);
    },
    [load],
  );

  if (loading) {
    return <p className="p-6 text-sm text-neutral-500">Loading...</p>;
  }

  if (message === "You must be logged in to manage a profile") {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <Card title="Business profile" subtitle="Log in to create or edit your profile.">
          <p className="text-sm text-neutral-700">{message}</p>
          <button
            type="button"
            onClick={() => {
              router.push("/login");
            }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Go to login
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <Card
        title={profile === null ? "Create business profile" : "Edit business profile"}
        subtitle="The generator reads these fields to match your brand voice."
      >
        <ProfileForm
          key={profile === null ? "new" : profile.id}
          initial={draftOf(profile)}
          onSave={onSave}
        />
        {message === null || message === "You must be logged in to manage a profile" ? null : (
          <p className="mt-4 text-sm text-neutral-600">{message}</p>
        )}
      </Card>
    </main>
  );
}
