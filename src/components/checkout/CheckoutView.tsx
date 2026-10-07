"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Stepper, type StepperErrorSummary } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Choice";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AccordionItem } from "@/components/ui/Accordion";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { ProductRow } from "@/components/product/ProductCard";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { AddressFields } from "@/components/account/fields/AddressFields";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { checkoutFormSchema, type CheckoutFormData } from "@/lib/validators/checkout";
import { countryName, DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { regionLabel, regionSentence } from "@/lib/catalog/platforms";
import { CheckoutCounter } from "./CheckoutCounter";
import { TotalsList } from "./TotalsList";
import { quotePayloadItems, useCheckoutQuote, type QuoteProblem } from "./useCheckoutQuote";

const DRAFT_KEY = "keyrook-checkout-draft";
const CHECKOUT_PATH = "/checkout";

type FieldName = FieldPath<CheckoutFormData>;

const STEP_FIELDS: FieldName[][] = [
  [],
  ["contact.email", "contact.firstName", "contact.lastName", "contact.phoneCountry", "contact.phone", "billing.street", "billing.address2", "billing.city", "billing.postcode", "billing.country"],
  ["acceptedPolicies", "acceptedWaiver"],
];

const LAST_STEP = 2;

const FIELD_IDS: Record<string, string> = {
  "contact.email": "co-email",
  "contact.firstName": "co-first",
  "contact.lastName": "co-last",
  "contact.phoneCountry": "co-phone-dial",
  "contact.phone": "co-phone-number",
  "billing.street": "bl-street",
  "billing.address2": "bl-address2",
  "billing.city": "bl-city",
  "billing.postcode": "bl-postcode",
  "billing.country": "bl-country",
  acceptedPolicies: "co-accept",
  acceptedWaiver: "co-waiver",
};

const EMPTY: CheckoutFormData = {
  contact: { email: "", firstName: "", lastName: "", phoneCountry: DEFAULT_COUNTRY_CODE, phone: "" },
  billing: { street: "", address2: "", city: "", country: "", postcode: "" },
  acceptedPolicies: false,
  acceptedWaiver: false,
};

const KNOWN_PROBLEMS = [
  "PAYMENTS_NOT_CONNECTED",
  "PAYMENT_UNAVAILABLE",
  "PAYMENT_LINK_FAILED",
  "TOTAL_CHANGED",
  "ORDER_LIMIT",
  "PRODUCT_UNAVAILABLE",
  "PRICE_UNAVAILABLE",
  "ITEM_LIMIT",
  "ORDER_VALUE_LIMIT",
  "CUSTOMER_LIMIT",
  "AGE_REQUIRED",
  "CART_EMPTY",
  "INVALID_REQUEST",
  "RATE_LIMITED",
  "UNAUTHORISED",
  "NETWORK",
];

interface SubmitProblem extends QuoteProblem {
  total?: number;
}

function readDraft(): Partial<CheckoutFormData> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormData>) : null;
  } catch {
    return null;
  }
}

function writeDraft(values: CheckoutFormData) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, acceptedPolicies: undefined, acceptedWaiver: undefined }));
  } catch {}
}

function getAt(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), source);
}

export function CheckoutView() {
  const t = useTranslations("checkout");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const searchParams = useSearchParams();
  const { cart, displayTotals, isHydrated, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const [step, setStep] = useState(0);
  const [errorSummary, setErrorSummary] = useState<StepperErrorSummary | null>(null);
  const [submitProblem, setSubmitProblem] = useState<SubmitProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [acceptedChanges, setAcceptedChanges] = useState("");
  const [regionChecked, setRegionChecked] = useState(false);
  const prefilled = useRef(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });
  const { register, watch, trigger, getValues, setValue, getFieldState, formState } = form;

  const { quote, setQuote, problem, loading } = useCheckoutQuote(cart.items, currency, isHydrated);
  const quoteReady = Boolean(quote && quote.currency === currency && !loading && !problem);
  const totals = quote && quote.currency === currency ? quote.totals : displayTotals;

  useEffect(() => {
    if (searchParams.get("payment") === "failed") setPaymentFailed(true);
  }, [searchParams]);

  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const draft = readDraft();
    if (draft) {
      form.reset({ ...EMPTY, ...draft, contact: { ...EMPTY.contact, ...draft.contact }, billing: { ...EMPTY.billing, ...draft.billing }, acceptedPolicies: false, acceptedWaiver: false });
    }
  }, [form]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.profile) return;
        const profile = data.profile as { email: string | null; firstName: string | null; lastName: string | null; phoneCountry: string | null; phoneNational: string | null };
        const address = (data.addresses as { address1: string; address2: string | null; city: string; postalCode: string; country: string; isDefault: boolean }[] | undefined)?.find((a) => a.isDefault) ?? data.addresses?.[0];
        const fill = (name: FieldName, value: string | null | undefined) => {
          if (value && !getValues(name)) setValue(name, value as never, { shouldDirty: false });
        };
        fill("contact.email", profile.email);
        fill("contact.firstName", profile.firstName);
        fill("contact.lastName", profile.lastName);
        fill("contact.phone", profile.phoneNational);
        if (profile.phoneCountry && !getFieldState("contact.phone").isDirty) setValue("contact.phoneCountry", profile.phoneCountry);
        if (address) {
          fill("billing.street", address.address1);
          fill("billing.address2", address.address2);
          fill("billing.city", address.city);
          fill("billing.postcode", address.postalCode);
          fill("billing.country", address.country);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, getValues, setValue, getFieldState]);

  const values = watch();
  const fieldLabel = useCallback(
    (name: string) => {
      const key = name.split(".").pop() as string;
      const map: Record<string, string> = {
        email: tf("email"),
        firstName: tf("firstName"),
        lastName: tf("lastName"),
        phoneCountry: tf("dialCode"),
        phone: tf("phone"),
        street: tf("street"),
        address2: tf("address2"),
        city: tf("city"),
        postcode: tf("postcode"),
        country: tf("country"),
        acceptedPolicies: t("review.acceptLabelShort"),
        acceptedWaiver: t("review.waiverLabelShort"),
      };
      return map[key] ?? key;
    },
    [t, tf],
  );

  const buildSummary = useCallback(
    (names: string[]): StepperErrorSummary | null => {
      const failed = names.filter((name) => getFieldState(name as FieldName).error);
      if (failed.length === 0) return null;
      return {
        message: t("errors.checkFields", { count: failed.length }),
        fields: failed.map((name) => ({ id: FIELD_IDS[name] ?? name, label: fieldLabel(name) })),
      };
    },
    [getFieldState, fieldLabel, t],
  );

  const goTo = useCallback(
    (next: number) => {
      writeDraft(getValues());
      setErrorSummary(null);
      setStep(next);
    },
    [getValues],
  );

  const handleContinue = async () => {
    if (step === 0 && !user) return;
    const names = STEP_FIELDS[step];
    if (names.length) {
      const valid = await trigger(names);
      if (!valid) {
        setErrorSummary(buildSummary(names));
        return;
      }
    }
    goTo(Math.min(step + 1, LAST_STEP));
  };

  const pay = form.handleSubmit(
    async (data) => {
      if (!quote || !quoteReady || !user) return;
      setSubmitting(true);
      setSubmitProblem(null);
      writeDraft(data);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: quotePayloadItems(cart.items), currency, form: data, expectedTotal: quote.totals.total }),
        });
        const body = await res.json().catch(() => ({ code: "SERVER_ERROR" }));
        if (res.ok && typeof body.paymentLink === "string" && (/^https:\/\//.test(body.paymentLink) || (process.env.NODE_ENV !== "production" && /^http:\/\/localhost[:/]/.test(body.paymentLink)))) {
          window.location.assign(body.paymentLink);
          return;
        }
        if (body.code === "TOTAL_CHANGED" && body.quote) {
          setQuote(body.quote);
          setSubmitProblem({ code: "TOTAL_CHANGED", total: body.quote.totals.total });
        } else {
          setSubmitProblem(res.ok ? { code: "SERVER_ERROR" } : body);
        }
      } catch {
        setSubmitProblem({ code: "NETWORK" });
      }
      setSubmitting(false);
    },
    (errors) => {
      const firstStep = [0, 1, 2].find((index) => STEP_FIELDS[index].some((name) => getAt(errors, name)));
      const target = firstStep ?? LAST_STEP;
      if (target !== step) setStep(target);
      setErrorSummary(buildSummary(STEP_FIELDS[target]));
    },
  );

  const problemText = (p: SubmitProblem | QuoteProblem | null) => {
    if (!p) return null;
    const code = KNOWN_PROBLEMS.includes(p.code) || t.has(`problems.${p.code}`) ? p.code : "SERVER_ERROR";
    return t(`problems.${code}`, {
      name: p.name ?? "",
      max: p.max ?? STORE_POLICY.limits.maxItemsPerOrder,
      total: formatPrice((p as SubmitProblem).total ?? totals.total, currency),
      email: COMPANY.email,
      minAge: STORE_POLICY.minAge,
      type: (p as QuoteProblem & { type?: string }).type ?? "",
      value: formatPrice((p as QuoteProblem & { value?: number }).value ?? STORE_POLICY.limits.maxOrderValue, STORE_POLICY.currency),
    });
  };

  const contactSummary = [values.contact?.firstName, values.contact?.lastName].filter(Boolean).join(" ");
  const billingSummary = [values.billing?.city, countryName(values.billing?.country)].filter(Boolean).join(", ");
  const imageFor = useMemo(() => new Map(cart.items.map((item) => [item.productId, item.imageUrl])), [cart.items]);

  if (!isHydrated || authLoading) {
    return <ReadoutLoader block />;
  }

  if (cart.items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-narrow px-gutter py-12">
        <h1 className="m-0 text-step-5 leading-none text-ink">{t("title")}</h1>
        <EmptyState title={t("empty.title")} subtitle={t("empty.subtitle")} actionLabel="Browse the catalogue" actionHref="/catalog" align="start" className="px-0" />
      </div>
    );
  }

  const counterProps = { items: cart.items, totals, currency, quote, loading };

  const accountPanel = !user ? (
    <div className="flex flex-col items-start gap-5">
      <p className="m-0 max-w-[52ch] text-step-0 text-ink">Your keys are kept in your account, so you’ll need one to receive them.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button as={Link} href={`/auth/login?next=${encodeURIComponent(CHECKOUT_PATH)}`} size="lg">
          Sign in
        </Button>
        <Button as={Link} href={`/auth/register?next=${encodeURIComponent(CHECKOUT_PATH)}`} size="lg" variant="outline">
          Create account
        </Button>
      </div>
      <p className="m-0 text-ui-sm text-ink-muted">Your cart stays as it is while you sign in.</p>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-step-0 text-ink">
        Signed in as <span className="font-[560]">{user.email}</span>
      </p>
      <p className="m-0 max-w-[60ch] text-ui-sm text-ink-muted">{BRAND.name} keeps your keys in this account. They appear on the order page once your payment is confirmed, and we email you when they’re ready.</p>
      <Link href={`/auth/login?next=${encodeURIComponent(CHECKOUT_PATH)}`} className="mt-1 w-fit text-ui-sm font-[560] text-ink underline underline-offset-4">
        Not you? Switch account
      </Link>
    </div>
  );

  const billingPanel = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <Input
          id="co-email"
          type="email"
          label={tf("email")}
          required
          autoComplete="email"
          hint="We send your receipt and delivery updates here."
          error={fe(formState.errors.contact?.email?.message)}
          {...register("contact.email")}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input id="co-first" label={tf("firstName")} required autoComplete="given-name" error={fe(formState.errors.contact?.firstName?.message)} {...register("contact.firstName")} />
          <Input id="co-last" label={tf("lastName")} required autoComplete="family-name" error={fe(formState.errors.contact?.lastName?.message)} {...register("contact.lastName")} />
        </div>
      </div>
      <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 border-t border-line p-0 pt-6">
        <legend className="eyebrow float-left mb-1 w-full p-0">{t("delivery.billingTitle")}</legend>
        <p className="m-0 text-ui-sm text-ink-muted">{t("delivery.billingHint")}</p>
        <AddressFields
          idPrefix="bl"
          autoCompleteSection="billing"
          registers={{
            street: register("billing.street"),
            address2: register("billing.address2"),
            city: register("billing.city"),
            postcode: register("billing.postcode"),
            country: register("billing.country"),
          }}
          errors={{
            street: fe(formState.errors.billing?.street?.message),
            address2: fe(formState.errors.billing?.address2?.message),
            city: fe(formState.errors.billing?.city?.message),
            postcode: fe(formState.errors.billing?.postcode?.message),
            country: fe(formState.errors.billing?.country?.message),
          }}
        />
      </fieldset>
      <div className="flex flex-col gap-2 border-t border-line pt-6">
        <PhoneField
          idPrefix="co-phone"
          dialRegister={register("contact.phoneCountry")}
          numberRegister={register("contact.phone")}
          error={fe(formState.errors.contact?.phone?.message)}
          dialError={fe(formState.errors.contact?.phoneCountry?.message)}
          required={false}
        />
      </div>
    </div>
  );

  const payLabel = quoteReady && quote ? t("review.pay", { amount: formatPrice(quote.totals.total, quote.currency) }) : t("review.payPending");
  const regionRequired = STORE_POLICY.checkout.requireRegionCheck;
  const accepted = Boolean(values.acceptedPolicies) && Boolean(values.acceptedWaiver) && (!regionRequired || regionChecked);
  const lines =
    quote && quote.currency === currency
      ? quote.lines
      : cart.items.map((item, index) => ({ productId: item.productId, name: item.name, variantName: item.variantName ?? null, quantity: item.quantity, unit: totals.lines[index]?.unit ?? 0, total: totals.lines[index]?.total ?? 0 }));

  const priceChanges =
    quote && quote.currency === currency
      ? quote.lines
          .map((line) => {
            const index = cart.items.findIndex((item) => item.productId === line.productId);
            const was = index >= 0 ? displayTotals.lines[index]?.unit ?? null : null;
            return was !== null && Math.abs(was - line.unit) >= 0.01 ? { productId: line.productId, name: line.name, was, now: line.unit } : null;
          })
          .filter((c): c is { productId: string; name: string; was: number; now: number } => Boolean(c))
      : [];
  const changeSignature = priceChanges.map((c) => `${c.productId}:${c.now}`).join("|");
  const priceIssueOpen = priceChanges.length > 0 && acceptedChanges !== changeSignature;
  const provider = STORE_POLICY.payment.providerName ?? "our payment provider";
  const providerPossessive = STORE_POLICY.payment.providerName ? `${STORE_POLICY.payment.providerName}'s` : "our payment provider's";

  const reviewPanel = (
    <div className="flex flex-col gap-7">
      {priceIssueOpen ? (
        <Alert
          tone="warning"
          title="A price changed when we re-confirmed it"
          action={
            <Button size="sm" onPress={() => setAcceptedChanges(changeSignature)}>
              Accept new price
            </Button>
          }
        >
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {priceChanges.map((c) => (
              <li key={c.productId}>
                The price of {c.name} changed from <s className="font-mono text-data text-ink-muted">{formatPrice(c.was, currency)}</s> to <span className="font-mono text-data font-semibold">{formatPrice(c.now, currency)}</span>.{" "}
                <button type="button" onClick={() => removeItem(c.productId)} className="cursor-pointer font-semibold underline underline-offset-4">
                  Remove it
                </button>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div>
        <h3 className="eyebrow m-0 mb-2">{t("review.itemsTitle")}</h3>
        <ul className="m-0 flex list-none flex-col divide-y divide-line border-y border-line p-0">
          {lines.map((line, index) => {
            const item = cart.items.find((i) => i.productId === line.productId);
            return (
              <li key={`${line.productId}-${index}`} className="py-3">
                <ProductRow
                  name={line.name}
                  imageUrl={imageFor.get(line.productId) ?? null}
                  keyInfo={item?.key}
                  meta={
                    <>
                      {line.quantity > 1 ? <span className="font-mono text-[0.75rem] text-ink-muted">{line.quantity} keys</span> : null}
                      {item?.key ? <span className="text-ui-sm text-ink-muted">Region: {regionLabel(item.key.region)}. {regionSentence(item.key.region)}.</span> : null}
                    </>
                  }
                  aside={<span className="font-mono text-data text-ink">{formatPrice(line.total, currency)}</span>}
                />
              </li>
            );
          })}
        </ul>
        <TotalsList totals={totals} currency={currency} showCurrencyCode totalSize="md" className="mt-4" />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        {regionRequired ? <Checkbox id="co-region" label="I've checked the platform and region of each key." checked={regionChecked} onChange={(e) => setRegionChecked(e.target.checked)} /> : null}
        <Checkbox
          id="co-accept"
          label={t.rich("review.accept", {
            terms: (chunks) => (
              <Link href="/policies/terms" target="_blank" className="font-semibold underline underline-offset-4">
                {chunks}
              </Link>
            ),
            refunds: (chunks) => (
              <Link href="/policies/returns" target="_blank" className="font-semibold underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
          error={fe(formState.errors.acceptedPolicies?.message)}
          {...register("acceptedPolicies")}
        />
        <Checkbox
          id="co-waiver"
          label={
            <>
              {STORE_POLICY.waiver.text}{" "}
              <Link href="/policies/returns#withdrawal" target="_blank" className="font-[560] underline underline-offset-4">
                Refund policy
              </Link>
            </>
          }
          error={fe(formState.errors.acceptedWaiver?.message)}
          {...register("acceptedWaiver")}
        />
      </div>

      {submitProblem ? (
        <Alert tone={submitProblem.code === "TOTAL_CHANGED" ? "warning" : "danger"} title={t(submitProblem.code === "TOTAL_CHANGED" ? "problems.totalChangedTitle" : "problems.title")}>
          {problemText(submitProblem)}
        </Alert>
      ) : null}
      {problem ? (
        <Alert tone="danger" title={t("problems.title")}>
          {problemText(problem)}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap-reverse items-center justify-between gap-4">
          <Button variant="ghost" onPress={() => goTo(1)}>
            {t("back")}
          </Button>
          <Button
            type="submit"
            size="lg"
            isDisabled={!accepted || !quoteReady || !user || priceIssueOpen}
            isLoading={submitting}
            startContent={<ShieldCheck size={18} aria-hidden="true" />}
            className="max-sm:w-full"
          >
            {payLabel}
          </Button>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <PaymentLogos height={28} />
          {STORE_POLICY.payment.hostedPage ? (
            <p className="m-0 max-w-[60ch] text-ui-sm text-ink-muted">
              You’ll enter your card details on {providerPossessive} hosted payment page{STORE_POLICY.payment.threeDSecure ? " with 3-D Secure" : ""}. We never see or store your card number.
            </p>
          ) : (
            <p className="m-0 text-ui-sm text-ink-muted">Card payments are processed securely by {provider}. We never see or store your full card number.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-narrow px-gutter pb-20 pt-8 lg:pt-12">
      <h1 className="m-0 mb-6 text-step-5 leading-[1.04] text-ink lg:mb-10">{t("title")}</h1>

      <div className="mb-6 border-y border-line lg:hidden">
        <AccordionItem title={`Show summary · ${formatPrice(totals.total, currency)}`} open={summaryOpen} onOpenChange={setSummaryOpen} headingLevel={2} flush className="border-b-0">
          <CheckoutCounter {...counterProps} headingLevel={3} />
        </AccordionItem>
      </div>

      {paymentFailed ? (
        <Alert
          tone="danger"
          title={t("paymentFailed.title")}
          className="mb-6"
          action={
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                setPaymentFailed(false);
                goTo(LAST_STEP);
              }}
            >
              {t("paymentFailed.retry")}
            </Button>
          }
        >
          {t("paymentFailed.body")}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        <form noValidate onSubmit={pay} className="min-w-0 lg:col-span-7" aria-label={t("title")}>
          <Stepper
            label={t("stepsLabel")}
            current={step}
            onEdit={(index) => goTo(index)}
            onContinue={handleContinue}
            onBack={() => goTo(Math.max(0, step - 1))}
            continueLabel={t("continue")}
            continueDisabled={step === 0 && !user}
            hideActions={step === LAST_STEP}
            errorSummary={errorSummary}
            steps={[
              { id: "account", title: "Account", short: "Account", summary: user ? `Signed in as ${user.email}` : undefined, content: accountPanel },
              { id: "billing", title: "Billing details", short: "Details", summary: [contactSummary, values.contact?.email, billingSummary].filter(Boolean).join(" · ") || undefined, content: billingPanel },
              { id: "review", title: "Review and pay", short: "Review & pay", content: reviewPanel },
            ]}
          />
        </form>
        <aside aria-label={t("counter.title")} className="hidden lg:col-span-5 lg:block">
          <div className="plate sticky top-6 p-6">
            <CheckoutCounter {...counterProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
