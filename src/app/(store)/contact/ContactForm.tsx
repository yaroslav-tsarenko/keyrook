"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validators/contact";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";

const SUBJECT_KEYS = ["order", "delivery", "returns", "product", "other"] as const;

function isSubjectKey(value: string): value is (typeof SUBJECT_KEYS)[number] {
  return (SUBJECT_KEYS as readonly string[]).includes(value);
}

export function ContactForm({ replyTime, prefilledOrder, prefilledTopic = "" }: { replyTime: string; prefilledOrder: string; prefilledTopic?: string }) {
  const t = useTranslations("contact");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      orderNumber: prefilledOrder,
      subject: prefilledOrder ? t("subjects.order") : isSubjectKey(prefilledTopic) ? t(`subjects.${prefilledTopic}`) : "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setFailed(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSentTo(data.email);
      reset();
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setFailed(true);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  };

  if (sentTo) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-control bg-raised p-6 shadow-[inset_2px_0_0_var(--color-success)] outline-none sm:p-8">
        <h2 className="m-0 text-step-2 font-semibold leading-[1.12] text-ink">{t("successTitle")}</h2>
        <p className="mt-3 text-step-0 leading-[1.6] text-ink">{t("success", { email: sentTo, replyTime })}</p>
        <div className="mt-6">
          <Button variant="outline" onPress={() => setSentTo(null)}>
            {t("sendAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} aria-labelledby="contact-form-title" className="flex flex-col gap-6">
      <h2 id="contact-form-title" className="m-0 text-step-2 font-semibold leading-[1.12] text-ink">
        {t("formTitle")}
      </h2>

      {failed ? (
        <div ref={statusRef} tabIndex={-1} className="outline-none">
          <Alert tone="danger">{t("error")}</Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
        <Input label={t("name")} autoComplete="name" required error={errors.name?.message} {...register("name")} />
        <Input label={t("email")} type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
        <Select
          label={t("subject")}
          required
          placeholder={t("subjectPlaceholder")}
          options={SUBJECT_KEYS.map((key) => ({ value: t(`subjects.${key}`), label: t(`subjects.${key}`) }))}
          error={errors.subject?.message}
          {...register("subject")}
        />
        <Input
          label={t("orderNumber")}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          hint={t("orderNumberHint")}
          error={errors.orderNumber?.message}
          {...register("orderNumber")}
        />
      </div>

      <Textarea label={t("message")} required rows={7} hint={t("messageHint")} error={errors.message?.message} {...register("message")} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta m-0 max-w-[40ch] text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
          {t.rich("privacyNote", { privacy: (chunks) => <Link href="/policies/privacy">{chunks}</Link> })}
        </p>
        <Button type="submit" size="lg" isLoading={isSubmitting} className="shrink-0 max-sm:w-full">
          {t("send")}
        </Button>
      </div>
    </form>
  );
}
