import type { CatalogProduct } from "@/components/product/product-face";
import type { EditionOption } from "@/components/product/EditionSelector";
import type { RequirementRow } from "@/components/product/BeforeYouBuy";
import type { KeySummary } from "@/lib/keys/taxonomy";

function key(title: string, platform: string, region: string, productType = "game", extra: Partial<KeySummary> = {}): KeySummary {
  return { title, productType, platform, region, edition: null, languages: ["English", "German", "French", "Spanish"], genres: [], releaseYear: 2025, validity: null, ...extra };
}

function product(id: string, title: string, price: number, k: KeySummary, comparePrice: number | null = null): CatalogProduct {
  return { id: `sample-${id}`, name: title, slug: `sample-${id}`, price, comparePrice, quantity: 9, images: [], key: k };
}

export const SAMPLE_RESULTS: CatalogProduct[] = [
  product("lantern-coast", "Lantern Coast", 24.99, key("Lantern Coast", "steam", "global")),
  product("lantern-coast-deluxe", "Lantern Coast", 34.99, key("Lantern Coast", "steam", "global", "game", { edition: "Deluxe Edition" })),
  product("lantern-coast-xbox", "Lantern Coast", 26.49, key("Lantern Coast", "xbox", "europe", "game", { languages: ["English", "German", "French"] })),
  product("lantern-coast-tides", "Lantern Coast: Tides of Ash", 9.99, key("Lantern Coast: Tides of Ash", "steam", "global", "dlc")),
  product("lantern-coast-ps", "Lantern Coast", 27.99, key("Lantern Coast", "playstation", "europe", "game", { languages: ["English", "French", "Spanish", "Italian"] })),
  product("lantern-coast-switch", "Lantern Coast", 29.99, key("Lantern Coast", "nintendo", "europe", "game", { languages: ["English", "German"] })),
];

export const SAMPLE_PRODUCT: CatalogProduct = product("lantern-coast-standard", "Lantern Coast", 24.99, key("Lantern Coast", "steam", "global"));
export const SAMPLE_DELUXE: CatalogProduct = product("lantern-coast-deluxe-pdp", "Lantern Coast", 34.99, key("Lantern Coast", "steam", "global", "game", { edition: "Deluxe Edition" }));

export function sampleEditions(current: "standard" | "deluxe"): EditionOption[] {
  return [
    { id: "standard", slug: "sample-standard", name: "Standard Edition", adds: null, price: 24.99, current: current === "standard" },
    { id: "deluxe", slug: "sample-deluxe", name: "Deluxe Edition", adds: "+ Season Pass", price: 34.99, current: current === "deluxe" },
  ];
}

export const SAMPLE_REQUIREMENTS: RequirementRow[] = [
  { key: "platform", label: "Platform", icon: "platform", value: "Activates on Steam. You need a Steam account and the Steam app." },
  { key: "region", label: "Region", icon: "region", value: "Global: no regional lock" },
  { key: "languages", label: "Languages", icon: "languages", value: "English, German, French, Spanish" },
  { key: "delivery", label: "Delivery", icon: "delivery", value: "To your account, usually within minutes after payment is confirmed" },
];

export const SAMPLE_ORDER = {
  number: "KR-20481",
  total: 34.99,
  title: "Lantern Coast",
  key: key("Lantern Coast", "steam", "global", "game", { edition: "Deluxe Edition" }),
  createdAt: "2026-10-06T14:18:00Z",
  paidAt: "2026-10-06T14:19:00Z",
  issuedAt: "2026-10-06T14:21:00Z",
};

export const SAMPLE_LIBRARY = ["Saltmarsh Run", "Orbit Freight", "Hollowstone", "Night Ferry", "Ironvale Tactics"];
