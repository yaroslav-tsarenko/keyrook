export const POLICY_SLUGS = [
  "terms",
  "privacy",
  "cookies",
  "returns",
  "shipping",
  "payment",
  "warranty",
  "complaints",
  "acceptable-use",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export function policyHref(slug: PolicySlug) {
  return `/policies/${slug}`;
}
