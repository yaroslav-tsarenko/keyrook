export const GOOGLE_TAXONOMY_VERSION = "2021-09-21";

export const GOOGLE_TAXONOMY_DIGITAL_ITEMS = { id: 5032, name: "Software > Digital Goods & Currency" } as const;

export function googleTaxonomyFor(): { id: number; name: string } {
  return GOOGLE_TAXONOMY_DIGITAL_ITEMS;
}
