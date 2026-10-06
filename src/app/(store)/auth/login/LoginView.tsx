"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth";
import { safeNextPath } from "@/lib/safe-next";
import { AuthAside } from "../AuthAside";

export function LoginView() {
  const t = useTranslations("auth.login");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [problem, setProblem] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, formState } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), mode: "onTouched" });

  useEffect(() => {
    if (problem) alertRef.current?.focus();
  }, [problem]);

  const onSubmit = handleSubmit(async (data) => {
    setProblem(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProblem(res.status === 401 || res.status === 400 ? t("invalid") : t("failed"));
        return;
      }
      const admin = body.user?.role === "ADMIN" || body.user?.role === "SUPER_ADMIN";
      window.location.assign(admin && next === "/account" ? "/admin" : next);
    } catch {
      setProblem(t("failed"));
    }
  });

  return (
    <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-12 px-gutter pb-24 pt-10 lg:grid-cols-12 lg:gap-0 lg:pt-16">
      <div className="flex flex-col gap-6 lg:col-span-6 lg:pr-10">
        <h1 className="m-0 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">{t("title")}</h1>
        {searchParams.get("next") === "/checkout" ? <p className="m-0 text-ink-muted">{t("checkoutHint")}</p> : null}
        {searchParams.get("error") === "steam" ? <Alert tone="danger" title={t("steamFailed")} /> : null}
        {problem ? (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger" title={problem} />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button as="a" href={`/api/auth/steam?next=${encodeURIComponent(next)}`} size="lg" variant="steam" fullWidth>
            Sign in through Steam
          </Button>
          <p className="m-0 text-ui-sm text-ink-muted">{t("steamNote")}</p>
        </div>
        <p className="eyebrow m-0 flex items-center gap-3 before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or use email</p>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <Input id="login-email" type="email" label={tf("email")} autoComplete="email" required error={fe(formState.errors.email?.message)} {...register("email")} />
          <PasswordInput id="login-password" label={tf("password")} autoComplete="current-password" required error={fe(formState.errors.password?.message)} {...register("password")} />
          <Link href="/auth/forgot-password" className="self-start text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            {t("forgot")}
          </Link>
          <Button type="submit" size="lg" isLoading={formState.isSubmitting} className="mt-2 w-full">
            {t("submit")}
          </Button>
        </form>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <AuthAside mode="login" />
      </div>
    </div>
  );
}
