"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper, type StepperErrorSummary } from "@/components/ui/Stepper";
import { Input, PasswordInput } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Choice";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { DateOfBirthField } from "@/components/account/fields/DateOfBirthField";
import { CountrySelect } from "@/components/account/fields/CountrySelect";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { RESTRICTED_TERRITORIES_STATEMENT, restrictedCountriesSentence } from "@/config/restricted-countries";
import { AuthAside } from "../AuthAside";

type Field = FieldPath<RegisterFormData>;

const STEPS: Field[][] = [
  ["email", "password", "confirmPassword"],
  ["firstName", "lastName", "phoneCountry", "phone", "dateOfBirth"],
  ["street", "city", "country", "postcode", "acceptedTerms"],
];

const IDS: Record<string, string> = {
  email: "rg-email",
  password: "rg-password",
  confirmPassword: "rg-confirm",
  firstName: "rg-first",
  lastName: "rg-last",
  phoneCountry: "rg-phone-dial",
  phone: "rg-phone-number",
  dateOfBirth: "rg-dob-day",
  street: "rg-street",
  city: "rg-city",
  country: "rg-country",
  postcode: "rg-postcode",
  acceptedTerms: "rg-terms",
};


export function RegisterView() {
  const t = useTranslations("auth.register");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<StepperErrorSummary | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const { register, control, trigger, watch, handleSubmit, setError, getFieldState, getValues, formState } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneCountry: DEFAULT_COUNTRY_CODE,
      phone: "",
      dateOfBirth: "",
      street: "",
      city: "",
      country: "",
      postcode: "",
      acceptedTerms: false,
    },
  });

  const labelFor = useCallback(
    (name: string) => {
      const map: Record<string, string> = {
        email: tf("email"),
        password: tf("password"),
        confirmPassword: tf("confirmPassword"),
        firstName: tf("firstName"),
        lastName: tf("lastName"),
        phoneCountry: tf("dialCode"),
        phone: tf("phone"),
        dateOfBirth: tf("dateOfBirth"),
        street: tf("street"),
        city: tf("city"),
        country: tf("country"),
        postcode: tf("postcode"),
        acceptedTerms: t("termsShort"),
      };
      return map[name] ?? name;
    },
    [t, tf],
  );

  const summarise = useCallback(
    (names: Field[]) => {
      const failed = names.filter((name) => getFieldState(name).error);
      return failed.length ? { message: t("checkFields", { count: failed.length }), fields: failed.map((name) => ({ id: IDS[name], label: labelFor(name) })) } : null;
    },
    [getFieldState, labelFor, t],
  );

  const next = async () => {
    let ok = await trigger(STEPS[step]);
    if (step === 0 && ok && getValues("password") !== getValues("confirmPassword")) {
      setError("confirmPassword", { type: "manual", message: "passwordsMismatch" });
      ok = false;
    }
    if (!ok) {
      setSummary(summarise(STEPS[step]));
      return;
    }
    setSummary(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = handleSubmit(
    async (data) => {
      setProblem(null);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          window.location.assign("/account?welcome=1");
          return;
        }
        if (body.code === "EMAIL_TAKEN") {
          setError("email", { type: "server", message: "emailTaken" });
          setStep(0);
          setSummary({ message: t("checkFields", { count: 1 }), fields: [{ id: IDS.email, label: labelFor("email") }] });
          return;
        }
        if (body.code === "INVALID_REQUEST" && Array.isArray(body.issues)) {
          for (const issue of body.issues as { path: string; message: string }[]) {
            setError(issue.path as Field, { type: "server", message: issue.message });
          }
          const target = STEPS.findIndex((names) => names.some((name) => (body.issues as { path: string }[]).some((i) => i.path === name)));
          if (target >= 0) {
            setStep(target);
            setSummary(summarise(STEPS[target]));
          }
          return;
        }
        setProblem(t("failed"));
      } catch {
        setProblem(t("failed"));
      }
    },
    () => {
      const target = STEPS.findIndex((names) => names.some((name) => getFieldState(name).error));
      if (target >= 0) {
        setStep(target);
        setSummary(summarise(STEPS[target]));
      }
    },
  );

  const values = watch();
  const accepted = Boolean(values.acceptedTerms);

  const credentials = (
    <div className="flex flex-col gap-5">
      <Input id="rg-email" type="email" label={tf("email")} required autoComplete="email" error={fe(formState.errors.email?.message)} {...register("email")} />
      <PasswordInput id="rg-password" label={tf("password")} required autoComplete="new-password" hint={tf("passwordHint")} error={fe(formState.errors.password?.message)} {...register("password")} />
      <PasswordInput id="rg-confirm" label={tf("confirmPassword")} required autoComplete="new-password" error={fe(formState.errors.confirmPassword?.message)} {...register("confirmPassword")} />
    </div>
  );

  const about = (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="rg-first" label={tf("firstName")} required autoComplete="given-name" error={fe(formState.errors.firstName?.message)} {...register("firstName")} />
        <Input id="rg-last" label={tf("lastName")} required autoComplete="family-name" error={fe(formState.errors.lastName?.message)} {...register("lastName")} />
      </div>
      <PhoneField idPrefix="rg-phone" dialRegister={register("phoneCountry")} numberRegister={register("phone")} error={fe(formState.errors.phone?.message)} dialError={fe(formState.errors.phoneCountry?.message)} />
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field }) => <DateOfBirthField idPrefix="rg" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fe(formState.errors.dateOfBirth?.message)} />}
      />
    </div>
  );

  const address = (
    <div className="flex flex-col gap-5">
      <Input id="rg-street" label={tf("street")} required autoComplete="address-line1" error={fe(formState.errors.street?.message)} {...register("street")} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="rg-city" label={tf("city")} required autoComplete="address-level2" error={fe(formState.errors.city?.message)} {...register("city")} />
        <Input id="rg-postcode" label={tf("postcode")} required autoComplete="postal-code" className="uppercase" error={fe(formState.errors.postcode?.message)} {...register("postcode")} />
      </div>
      <CountrySelect id="rg-country" required error={fe(formState.errors.country?.message)} {...register("country")} />
      <p className="meta m-0 text-ink-muted">
        {t("restricted", { countries: restrictedCountriesSentence() })} {RESTRICTED_TERRITORIES_STATEMENT}
      </p>
      <div className="mt-2 border-t border-line pt-5">
        <Checkbox
          id="rg-terms"
          label={t.rich("terms", {
            link: (chunks) => (
              <Link href="/policies/terms" target="_blank" className="font-semibold underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
          description={t.rich("privacy", {
            link: (chunks) => (
              <Link href="/policies/privacy" target="_blank" className="underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
          error={fe(formState.errors.acceptedTerms?.message)}
          {...register("acceptedTerms")}
        />
      </div>
      {problem ? <Alert tone="danger" title={problem} /> : null}
      <div className="mt-2 flex flex-wrap-reverse items-center justify-between gap-4">
        <Button variant="ghost" onPress={() => setStep(1)}>
          {t("back")}
        </Button>
        <Button type="submit" size="lg" isDisabled={!accepted} isLoading={formState.isSubmitting} className="max-sm:w-full">
          {t("submit")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-12 px-gutter pb-24 pt-10 lg:grid-cols-12 lg:gap-0 lg:pt-16">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:max-w-[560px] lg:pr-6">
        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">{t("title")}</h1>
          <p className="m-0 text-ink-muted">{t("lead")}</p>
        </div>
        <form noValidate onSubmit={onSubmit}>
          <Stepper
            label={t("stepsLabel")}
            current={step}
            onEdit={(index) => {
              setSummary(null);
              setStep(index);
            }}
            onContinue={next}
            onBack={() => {
              setSummary(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            continueLabel={t("continue")}
            hideActions={step === 2}
            errorSummary={summary}
            steps={[
              { id: "credentials", title: t("steps.credentials"), summary: values.email || undefined, content: credentials },
              { id: "about", title: t("steps.about"), summary: [values.firstName, values.lastName].filter(Boolean).join(" ") || undefined, content: about },
              { id: "address", title: t("steps.address"), content: address },
            ]}
          />
        </form>
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <AuthAside mode="register" />
      </div>
    </div>
  );
}
