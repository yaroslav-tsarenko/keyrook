import type { PlatformKey } from "@/lib/keys/taxonomy";

export interface ActivationGuide {
  platform: PlatformKey;
  name: string;
  need: string;
  sentence: string;
  steps: string[];
  codeFormat: string | null;
  redeemUrl: string | null;
  redeemLabel: string;
  inAppOnly: boolean;
  agreement: boolean;
  menuPath: string[];
  verifiedAt: string;
}

const VERIFIED = "2026-10-06";

export const ACTIVATION: Record<Exclude<PlatformKey, "other">, ActivationGuide> = {
  steam: {
    platform: "steam",
    name: "Steam",
    need: "a Steam account and the Steam app",
    sentence: "Activates on Steam. You need a Steam account and the Steam app.",
    steps: ["Open Steam and sign in.", "Open the **Games** menu, then choose **Activate a Product on Steam…**", "Enter the key and follow the prompts.", "The game appears in your **Library**."],
    codeFormat: null,
    redeemUrl: "https://store.steampowered.com/account/registerkey",
    redeemLabel: "Steam's redeem page",
    inAppOnly: false,
    agreement: true,
    menuPath: ["Games", "Activate a Product on Steam…"],
    verifiedAt: VERIFIED,
  },
  epic: {
    platform: "epic",
    name: "Epic Games",
    need: "an Epic Games account",
    sentence: "Activates on Epic Games. You need an Epic Games account.",
    steps: ["Sign in to the Epic Games Launcher or epicgames.com.", "Open your account menu, then choose **Redeem Code**.", "Enter the key and choose **Redeem**."],
    codeFormat: null,
    redeemUrl: "https://store.epicgames.com/redeem",
    redeemLabel: "Epic's redeem page",
    inAppOnly: false,
    agreement: false,
    menuPath: ["Account", "Redeem Code"],
    verifiedAt: VERIFIED,
  },
  "ea-app": {
    platform: "ea-app",
    name: "EA app",
    need: "an EA account and the EA app",
    sentence: "Activates in the EA app. You need an EA account and the EA app.",
    steps: ["Open the EA app and sign in.", "Open the menu (☰), then choose **Redeem code**.", "Enter the key and choose **Next**."],
    codeFormat: null,
    redeemUrl: null,
    redeemLabel: "the EA app",
    inAppOnly: true,
    agreement: false,
    menuPath: ["Menu", "Redeem code"],
    verifiedAt: VERIFIED,
  },
  "ubisoft-connect": {
    platform: "ubisoft-connect",
    name: "Ubisoft Connect",
    need: "a Ubisoft account and Ubisoft Connect for PC",
    sentence: "Activates on Ubisoft Connect. You need a Ubisoft account and Ubisoft Connect for PC.",
    steps: ["Open Ubisoft Connect and sign in.", "Open the menu (☰), then choose **Activate a key**.", "Enter the key and confirm."],
    codeFormat: null,
    redeemUrl: null,
    redeemLabel: "Ubisoft Connect",
    inAppOnly: true,
    agreement: false,
    menuPath: ["Menu", "Activate a key"],
    verifiedAt: VERIFIED,
  },
  gog: {
    platform: "gog",
    name: "GOG",
    need: "a GOG account",
    sentence: "Activates on GOG. You need a GOG account.",
    steps: ["Go to gog.com/redeem and sign in.", "Enter the key.", "Confirm. The game appears in your GOG library."],
    codeFormat: null,
    redeemUrl: "https://www.gog.com/redeem",
    redeemLabel: "GOG's redeem page",
    inAppOnly: false,
    agreement: false,
    menuPath: ["Redeem"],
    verifiedAt: VERIFIED,
  },
  "battle-net": {
    platform: "battle-net",
    name: "Battle.net",
    need: "a Battle.net account and the Battle.net app",
    sentence: "Activates on Battle.net. You need a Battle.net account and the Battle.net app.",
    steps: ["Open Battle.net and sign in.", "Open your account menu, then choose **Redeem a Code**.", "Enter the key and confirm."],
    codeFormat: null,
    redeemUrl: "https://account.battle.net/",
    redeemLabel: "Battle.net account page",
    inAppOnly: false,
    agreement: false,
    menuPath: ["Account", "Redeem a Code"],
    verifiedAt: VERIFIED,
  },
  xbox: {
    platform: "xbox",
    name: "Xbox",
    need: "a Microsoft account",
    sentence: "Activates on Xbox. You need a Microsoft account.",
    steps: ["Go to redeem.microsoft.com and sign in with the account you play on, or on console open **Microsoft Store** and choose **Redeem**.", "Enter the 25-character code.", "Confirm."],
    codeFormat: "Xbox codes have 25 characters.",
    redeemUrl: "https://redeem.microsoft.com",
    redeemLabel: "Microsoft's redeem page",
    inAppOnly: false,
    agreement: false,
    menuPath: ["Microsoft Store", "Redeem"],
    verifiedAt: VERIFIED,
  },
  playstation: {
    platform: "playstation",
    name: "PlayStation",
    need: "a PlayStation Network account in the key's region",
    sentence: "Activates on PlayStation. You need a PlayStation Network account set to the key's region.",
    steps: ["On PS5 open **PlayStation Store**, choose **…** then **Redeem Code**, or on store.playstation.com open your profile and choose **Redeem Codes**.", "Enter the 12-character code.", "Confirm."],
    codeFormat: "PlayStation codes have 12 characters.",
    redeemUrl: "https://store.playstation.com",
    redeemLabel: "PlayStation Store",
    inAppOnly: false,
    agreement: false,
    menuPath: ["PlayStation Store", "Redeem Code"],
    verifiedAt: VERIFIED,
  },
  nintendo: {
    platform: "nintendo",
    name: "Nintendo",
    need: "a Nintendo Account (Nintendo Switch)",
    sentence: "Activates on Nintendo Switch. You need a Nintendo Account.",
    steps: ["Open **Nintendo eShop** and select your user.", "Choose **Redeem Code**.", "Enter the 16-character code and confirm."],
    codeFormat: "Nintendo codes have 16 characters.",
    redeemUrl: "https://ec.nintendo.com/redeem",
    redeemLabel: "Nintendo's redeem page",
    inAppOnly: false,
    agreement: false,
    menuPath: ["Nintendo eShop", "Redeem Code"],
    verifiedAt: VERIFIED,
  },
  rockstar: {
    platform: "rockstar",
    name: "Rockstar",
    need: "a Rockstar Games account and the Rockstar Games Launcher",
    sentence: "Activates on the Rockstar Games Launcher. You need a Rockstar Games account.",
    steps: ["Open the Rockstar Games Launcher and sign in.", "Open the account menu, then choose **Redeem Code**.", "Enter the key and confirm."],
    codeFormat: null,
    redeemUrl: null,
    redeemLabel: "the Rockstar Games Launcher",
    inAppOnly: true,
    agreement: false,
    menuPath: ["Account", "Redeem Code"],
    verifiedAt: VERIFIED,
  },
};

export const ACTIVATION_ORDER: Exclude<PlatformKey, "other">[] = ["steam", "epic", "ea-app", "ubisoft-connect", "xbox", "playstation", "nintendo", "gog", "battle-net", "rockstar"];

export const COMMON_PROBLEMS: { title: string; body: string }[] = [
  { title: "The key is for another region", body: "Check the region on the order page. A region-locked key activates only on an account registered in that region. If the product page stated a different region from the key you received, report it from the order." },
  { title: "The key says it was already used", body: "Report it from the order with a screenshot of the message. We check it with the issuer and replace the key, or refund it if no replacement is available." },
  { title: "The platform asks for a different account type", body: "Some keys need a specific account, such as a PlayStation account in the key's region. The requirement is listed under “Before you buy” on the product page." },
];

export function activationFor(platform: string | null | undefined): ActivationGuide | null {
  if (!platform || platform === "other") return null;
  return ACTIVATION[platform as Exclude<PlatformKey, "other">] ?? null;
}
