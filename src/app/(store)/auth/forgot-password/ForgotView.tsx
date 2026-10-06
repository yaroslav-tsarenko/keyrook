"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { forgotPasswordSchema, PASSWORD_RESET_TTL_MINUTES } from "@/lib/validators/auth";

export function ForgotView() {
  const t = useTranslations("auth.forgot");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [problem, setProblem] = useState(false);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({ resolver: zodResolver(forgotPasswordSchema), mode: "onTouched" });

  const onSubmit = handleSubmit(async (data) => {
    setProblem(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("request");
      setSentTo(data.email);
    } catch {
      setProblem(true);
    }
  });

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6 px-gutter pb-24 pt-10 lg:pt-16">
      <h1 className="m-0 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">{t("title")}</h1>
      {sentTo ? (
        <div className="flex flex-col gap-6" role="status">
          <p className="m-0 text-step-1 text-ink">{t("sent", { email: sentTo, minutes: PASSWORD_RESET_TTL_MINUTES })}</p>
          <p className="m-0 text-ink-muted">{t("sentHint")}</p>
          <Button as={Link} href="/auth/login" variant="outline" className="self-start">
            {t("backToSignIn")}
          </Button>
        </div>
      ) : (
        <>
          <p className="m-0 text-ink-muted">{t("lead")}</p>
          {problem ? <Alert tone="danger" title={t("failed")} /> : null}
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            <Input id="fp-email" type="email" label={tf("email")} autoComplete="email" required error={fe(formState.errors.email?.message)} {...register("email")} />
            <Button type="submit" size="lg" isLoading={formState.isSubmitting} className="max-sm:w-full sm:self-start">
              {t("submit")}
            </Button>
          </form>
          <Link href="/auth/login" className="self-start text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
            {t("backToSignIn")}
          </Link>
        </>
      )}
    </div>
  );
}
