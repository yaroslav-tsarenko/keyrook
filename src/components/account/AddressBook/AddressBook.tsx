"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Choice";
import { Plate } from "@/components/ui/Plate";
import { Alert } from "@/components/ui/Alert";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import { AddressFields } from "@/components/account/fields/AddressFields";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { addressSchema, type AddressFormData } from "@/lib/validators/profile";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { addressLines } from "@/lib/orders";
import { splitPhone } from "@/lib/account";
import { DEFAULT_COUNTRY_CODE, isDeliveryCountry } from "@/lib/countries";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils/cn";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";

interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

type Editing = { mode: "new" } | { mode: "edit"; address: SavedAddress } | null;

function toForm(address: SavedAddress | null, fallback: { firstName: string; lastName: string }): AddressFormData {
  const phone = splitPhone(address?.phone);
  return {
    firstName: address?.firstName ?? fallback.firstName,
    lastName: address?.lastName ?? fallback.lastName,
    street: address?.address1 ?? "",
    address2: address?.address2 ?? "",
    city: address?.city ?? "",
    postcode: address?.postalCode ?? "",
    country: address && isDeliveryCountry(address.country) ? address.country : "",
    phoneCountry: phone.phoneCountry || DEFAULT_COUNTRY_CODE,
    phone: phone.phoneNational,
    isDefault: address?.isDefault ?? false,
  };
}

function AddressForm({ editing, onDone, onCancel }: { editing: Exclude<Editing, null>; onDone: (message: string) => void; onCancel: () => void }) {
  const t = useTranslations("account.addresses");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const { user } = useAuth();
  const [problem, setProblem] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const existing = editing.mode === "edit" ? editing.address : null;
  const { register, handleSubmit, formState } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: toForm(existing, { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" }),
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    setProblem(false);
    const res = await fetch(existing ? `/api/account/addresses/${existing.id}` : "/api/account/addresses", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    if (!res || !res.ok) {
      setProblem(true);
      return;
    }
    onDone(existing ? t("updated") : t("added"));
  });

  return (
    <div className="border-t border-line">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5 bg-raised p-5 sm:p-6" aria-labelledby="address-form-title">
        <h2 id="address-form-title" ref={headingRef} tabIndex={-1} className="m-0 text-step-2 leading-none text-ink outline-none">
          {existing ? t("editTitle") : t("addTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input id="ad-first" label={tf("firstName")} required autoComplete="given-name" error={fe(formState.errors.firstName?.message)} {...register("firstName")} />
          <Input id="ad-last" label={tf("lastName")} required autoComplete="family-name" error={fe(formState.errors.lastName?.message)} {...register("lastName")} />
        </div>
        <AddressFields
          idPrefix="ad"
          registers={{ street: register("street"), address2: register("address2"), city: register("city"), postcode: register("postcode"), country: register("country") }}
          errors={{
            street: fe(formState.errors.street?.message),
            address2: fe(formState.errors.address2?.message),
            city: fe(formState.errors.city?.message),
            postcode: fe(formState.errors.postcode?.message),
            country: fe(formState.errors.country?.message),
          }}
        />
        <PhoneField idPrefix="ad-phone" required={false} optional dialRegister={register("phoneCountry")} numberRegister={register("phone")} error={fe(formState.errors.phone?.message)} />
        {!existing?.isDefault ? <Checkbox label={t("makeDefault")} {...register("isDefault")} /> : null}
        {problem ? <Alert tone="danger" title={t("saveFailed")} /> : null}
        <div className="flex flex-wrap-reverse items-center justify-between gap-4 pt-2">
          <Button variant="ghost" onPress={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" isLoading={formState.isSubmitting}>
            {existing ? t("saveChanges") : t("save")}
          </Button>
        </div>
      </form>
      
    </div>
  );
}

export function AddressBook() {
  const t = useTranslations("account.addresses");
  const { data, error, loading, reload } = useAccountData<{ addresses: SavedAddress[] }>("/api/account/addresses");
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<SavedAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const addresses = data?.addresses ?? [];

  const done = (message: string) => {
    setEditing(null);
    toast.success(message);
    reload();
  };

  const setDefault = async (address: SavedAddress) => {
    const res = await fetch(`/api/account/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setDefault: true }),
    }).catch(() => null);
    if (res?.ok) {
      toast.success(t("defaultSet"));
      reload();
    } else toast.error(t("saveFailed"));
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    const res = await fetch(`/api/account/addresses/${removing.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    setRemoving(null);
    if (res?.ok) {
      toast.success(t("removed"));
      reload();
    } else toast.error(t("saveFailed"));
  };

  return (
    <div>
      <AccountPageHeader
        title={t("title")}
        aside={
          !editing && addresses.length > 0 ? (
            <Button variant="outline" size="sm" startContent={<Plus size={16} aria-hidden="true" />} onPress={() => setEditing({ mode: "new" })} className="sm:ml-auto">
              {t("add")}
            </Button>
          ) : null
        }
      >
        <p className="m-0 text-ink-muted">{t("lead")}</p>
      </AccountPageHeader>

      {editing?.mode === "new" ? (
        <div className="mb-10">
          <AddressForm editing={editing} onDone={done} onCancel={() => setEditing(null)} />
        </div>
      ) : null}

      {loading ? (
        <div aria-busy="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-3 border border-line p-5">
              <SkeletonBar className="w-1/2" />
              <SkeletonBar className="w-2/3" />
              <SkeletonBar className="w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : addresses.length === 0 && !editing ? (
        <EmptyState title={t("emptyTitle")} subtitle={t("emptyBody")} actionLabel={t("add")} onAction={() => setEditing({ mode: "new" })} align="start" className="border-t border-line px-0 py-10" />
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2">
          {addresses.map((address) =>
            editing?.mode === "edit" && editing.address.id === address.id ? (
              <li key={address.id} className="sm:col-span-2">
                <AddressForm editing={editing} onDone={done} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <li key={address.id} className={cn("flex flex-col gap-4 border bg-raised p-5", address.isDefault ? "border-control" : "border-line")}>
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0 text-step-0 font-medium text-ink">{`${address.firstName} ${address.lastName}`}</p>
                  {address.isDefault ? <Plate variant="neutral">{t("default")}</Plate> : null}
                </div>
                <address className="text-ui-sm not-italic leading-[1.6] text-ink-muted">
                  {addressLines({ ...address, firstName: "", lastName: "" }).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {address.phone ? <span className="tabular block">{address.phone}</span> : null}
                </address>
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3">
                  <button type="button" onClick={() => setEditing({ mode: "edit", address })} className="min-h-11 cursor-pointer text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4">
                    {t("edit")}
                    <span className="sr-only"> {address.address1}</span>
                  </button>
                  {!address.isDefault ? (
                    <button type="button" onClick={() => setDefault(address)} className="min-h-11 cursor-pointer text-ui-sm text-ink underline decoration-1 underline-offset-4">
                      {t("setDefault")}
                      <span className="sr-only"> {address.address1}</span>
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setRemoving(address)} className="min-h-11 cursor-pointer text-ui-sm text-danger underline decoration-1 underline-offset-4">
                    {t("remove")}
                    <span className="sr-only"> {address.address1}</span>
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title={t("removeTitle")}
        message={removing ? t("removeBody", { address: `${removing.address1}, ${removing.city}` }) : ""}
        confirmLabel={t("remove")}
        cancelLabel={t("cancel")}
        isDangerous
        isLoading={busy}
      />
    </div>
  );
}
