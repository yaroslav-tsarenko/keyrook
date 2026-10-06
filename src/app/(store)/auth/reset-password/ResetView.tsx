"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validators/auth";

type State = "checking" | "invalid" | "form" | "done";

export function ResetView() {
  const t = useTranslations("auth.reset");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>(token ? "checking" : "invalid");
  const [problem, setProblem] = useState(false);
  const { register, handleSubmit, formState } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema), mode: "onTouched" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setState(data?.valid ? "form" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setState("form");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = handleSubmit(async (data) => {
    setProblem(false);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
        return;
      }
      if (body.code === "INVALID_TOKEN") {
        setState("invalid");
        return;
      }
      setProblem(true);
    } catch {
      setProblem(true);
    }
  });

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6 px-gutter pb-24 pt-10 lg:pt-16">
      <h1 className="m-0 text-step-5 leading-none tracking-[-0.01em] text-ink">{state === "done" ? t("doneTitle") : t("title")}</h1>
      {state === "checking" ? <ReadoutLoader label={t("checking")} block /> : null}
      {state === "invalid" ? (
        <>
          <Alert tone="danger" title={t("invalidTitle")}>
            {t("invalidBody")}
          </Alert>
          <Button as={Link} href="/auth/forgot-password" className="self-start">
            {t("requestNew")}
          </Button>
        </>
      ) : null}
      {state === "done" ? (
        <div role="status" className="flex flex-col gap-6">
          <p className="m-0 text-step-1 text-ink">{t("doneBody")}</p>
          <Button as={Link} href="/auth/login" className="self-start">
            {t("signIn")}
          </Button>
        </div>
      ) : null}
      {state === "form" ? (
        <>
          {problem ? <Alert tone="danger" title={t("failed")} /> : null}
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            <PasswordInput id="rp-password" label={tf("newPassword")} autoComplete="new-password" required hint={tf("passwordHint")} error={fe(formState.errors.password?.message)} {...register("password")} />
            <PasswordInput id="rp-confirm" label={tf("confirmPassword")} autoComplete="new-password" required error={fe(formState.errors.confirmPassword?.message)} {...register("confirmPassword")} />
            <Button type="submit" size="lg" isLoading={formState.isSubmitting} className="max-sm:w-full sm:self-start">
              {t("submit")}
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
