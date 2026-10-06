"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Input, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { DateOfBirthField } from "@/components/account/fields/DateOfBirthField";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { passwordChangeSchema, profileSchema, type PasswordChangeFormData, type ProfileFormData } from "@/lib/validators/profile";
import { DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { useAuth } from "@/providers/AuthProvider";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";

interface ProfileResponse {
  profile: { email: string | null; firstName: string | null; lastName: string | null; phoneCountry: string; phoneNational: string; dateOfBirth: string };
}

function PersonalForm({ initial }: { initial: ProfileResponse["profile"] }) {
  const t = useTranslations("account.profile");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const { refresh } = useAuth();
  const [problem, setProblem] = useState(false);
  const { register, control, handleSubmit, formState, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      firstName: initial.firstName ?? "",
      lastName: initial.lastName ?? "",
      phoneCountry: initial.phoneCountry || DEFAULT_COUNTRY_CODE,
      phone: initial.phoneNational,
      dateOfBirth: initial.dateOfBirth,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setProblem(false);
    const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (!res?.ok) {
      setProblem(true);
      return;
    }
    reset(data);
    await refresh();
    toast.success(t("saved"));
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {initial.email ? (
        <Input id="pf-email" label={tf("email")} value={initial.email} readOnly hint={t("emailHint")} />
      ) : (
        <Input id="pf-email" type="email" label={tf("email")} autoComplete="email" hint={t("emailAdd")} error={fe(formState.errors.email?.message)} {...register("email")} />
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="pf-first" label={tf("firstName")} required autoComplete="given-name" error={fe(formState.errors.firstName?.message)} {...register("firstName")} />
        <Input id="pf-last" label={tf("lastName")} required autoComplete="family-name" error={fe(formState.errors.lastName?.message)} {...register("lastName")} />
      </div>
      <PhoneField idPrefix="pf-phone" dialRegister={register("phoneCountry")} numberRegister={register("phone")} error={fe(formState.errors.phone?.message)} />
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field }) => <DateOfBirthField idPrefix="pf" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fe(formState.errors.dateOfBirth?.message)} />}
      />
      {problem ? <Alert tone="danger" title={t("saveFailed")} /> : null}
      <Button type="submit" isLoading={formState.isSubmitting} isDisabled={!formState.isDirty} className="self-start">
        {t("savePersonal")}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const t = useTranslations("account.profile");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const [problem, setProblem] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset, setError } = useForm<PasswordChangeFormData>({ resolver: zodResolver(passwordChangeSchema), mode: "onTouched" });

  const onSubmit = handleSubmit(async (data) => {
    setProblem(null);
    const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (res?.ok) {
      reset({ currentPassword: "", password: "", confirmPassword: "" });
      toast.success(t("passwordSaved"));
      return;
    }
    const body = await res?.json().catch(() => ({}));
    if (body?.code === "WRONG_PASSWORD") setError("currentPassword", { type: "server", message: "currentPasswordWrong" });
    else setProblem(t("saveFailed"));
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <PasswordInput id="pw-current" label={tf("currentPassword")} required autoComplete="current-password" error={fe(formState.errors.currentPassword?.message)} {...register("currentPassword")} />
      <PasswordInput id="pw-new" label={tf("newPassword")} required autoComplete="new-password" hint={tf("passwordHint")} error={fe(formState.errors.password?.message)} {...register("password")} />
      <PasswordInput id="pw-confirm" label={tf("confirmPassword")} required autoComplete="new-password" error={fe(formState.errors.confirmPassword?.message)} {...register("confirmPassword")} />
      {problem ? <Alert tone="danger" title={problem} /> : null}
      <Button type="submit" isLoading={formState.isSubmitting} className="self-start">
        {t("savePassword")}
      </Button>
    </form>
  );
}

export function ProfileForm() {
  const t = useTranslations("account.profile");
  const { data, error, loading, reload } = useAccountData<ProfileResponse>("/api/account/profile");
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#password" ? { personal: false, password: true } : { personal: true, password: false },
  );

  return (
    <div>
      <AccountPageHeader title={t("title")} />
      {loading ? (
        <ReadoutLoader block label={t("loading")} />
      ) : error || !data ? (
        <LoadError onRetry={reload} />
      ) : (
        <Accordion>
          <AccordionItem title={t("personalTitle")} headingLevel={2} open={open.personal} onOpenChange={(v) => setOpen((o) => ({ ...o, personal: v }))}>
            <PersonalForm initial={data.profile} />
          </AccordionItem>
          <AccordionItem id="password" title={t("passwordTitle")} headingLevel={2} open={open.password} onOpenChange={(v) => setOpen((o) => ({ ...o, password: v }))}>
            <PasswordForm />
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
