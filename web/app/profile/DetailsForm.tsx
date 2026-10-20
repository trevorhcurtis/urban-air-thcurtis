"use client";
import { Heading } from "@/components/ui/Heading";

import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import type { ProfileDetails } from "@/lib/session/types";
import { type Errors, hasErrors, validateProfile } from "@/lib/validation/rules";

const EMPTY: ProfileDetails = { first_name: "", last_name: "", email: "", phone: "" };

/** Saved contact details. Stored in this browser for 24 hours. */
export function DetailsForm() {
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<ProfileDetails>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { profile: ProfileDetails }) => setForm(json.profile))
      .catch(() => setStatus({ tone: "error", text: "We could not load your details." }))
      .finally(() => setLoaded(true));
  }, []);

  const set = (field: keyof ProfileDetails, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    const clientErrors = validateProfile(form);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setStatus({ tone: "success", text: "Your details are saved for this browser for 24 hours." });
      return;
    }
    const json = (await res.json().catch(() => ({}))) as { errors?: Errors; error?: string };
    if (json.errors) setErrors(json.errors);
    setStatus({ tone: "error", text: json.error ?? "Please fix the highlighted fields." });
  }

  return (
    <section aria-labelledby="details-heading" className="mt-10">
      <Heading level={2} size={4} id="details-heading">Your details</Heading>
      {!loaded ? (
        <p role="status" className="mt-4 text-text-muted">Loading your details…</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField id="pf-first" label="First name" required autoComplete="given-name" value={form.first_name} error={errors.first_name} onChange={(e) => set("first_name", e.target.value)} />
          <TextField id="pf-last" label="Last name" required autoComplete="family-name" value={form.last_name} error={errors.last_name} onChange={(e) => set("last_name", e.target.value)} />
          <TextField id="pf-email" label="Email" required type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
          <TextField id="pf-phone" label="Phone" type="tel" autoComplete="tel" value={form.phone} error={errors.phone} help="Optional." onChange={(e) => set("phone", e.target.value)} />
          <div className="md:col-span-2 space-y-3">
            {status && <Alert tone={status.tone === "success" ? "success" : "error"}>{status.text}</Alert>}
            <Button type="submit" loading={saving}>Save details</Button>
          </div>
        </form>
      )}
    </section>
  );
}
