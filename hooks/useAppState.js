"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "deja-pan-state-v10";

const XP = {
  urgeSurf: 40,
  productUse: 15,
  emptyBonus: 100,
  vaultRelease: 75,
  noBuyDay: 35,
  addProduct: 10,
};

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian rupee" },
  { code: "USD", symbol: "$", name: "US dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British pound" },
  { code: "SGD", symbol: "S$", name: "Singapore dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE dirham" },
  { code: "JPY", symbol: "¥", name: "Japanese yen" },
  { code: "KRW", symbol: "₩", name: "Korean won" },
  { code: "IDR", symbol: "Rp", name: "Indonesian rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian ringgit" },
  { code: "THB", symbol: "฿", name: "Thai baht" },
  { code: "PHP", symbol: "₱", name: "Philippine peso" },
  { code: "AUD", symbol: "A$", name: "Australian dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian dollar" },
];

const DEFAULT_CURRENCY = CURRENCIES[0];

export const THEMES = [
  {
    id: "paper",
    name: "paper",
    mode: "light",
    description: "warm paper, terracotta, ink",
    tokens: {
      bg: "#f6f0e6",
      bg2: "#efe4d2",
      surface: "rgba(255,255,255,0.58)",
      surfaceStrong: "rgba(255,255,255,0.84)",
      text: "#221b16",
      muted: "rgba(34,27,22,0.62)",
      faint: "rgba(34,27,22,0.38)",
      line: "rgba(34,27,22,0.13)",
      accent: "#9a5a4f",
      accentSoft: "rgba(154,90,79,0.13)",
      gold: "#8f743e",
      glow: "rgba(154,90,79,0.08)",
    },
  },
  {
    id: "cloud",
    name: "cloud",
    mode: "light",
    description: "blue grey, porcelain, soft navy",
    tokens: {
      bg: "#edf2f5",
      bg2: "#dde7ee",
      surface: "rgba(255,255,255,0.52)",
      surfaceStrong: "rgba(255,255,255,0.82)",
      text: "#17202a",
      muted: "rgba(23,32,42,0.60)",
      faint: "rgba(23,32,42,0.36)",
      line: "rgba(23,32,42,0.13)",
      accent: "#516d8a",
      accentSoft: "rgba(81,109,138,0.14)",
      gold: "#83704e",
      glow: "rgba(81,109,138,0.08)",
    },
  },
  {
    id: "pistachio",
    name: "pistachio",
    mode: "light",
    description: "sage, cream, soft olive",
    tokens: {
      bg: "#f1f2e8",
      bg2: "#dfe7d5",
      surface: "rgba(255,255,255,0.50)",
      surfaceStrong: "rgba(255,255,255,0.78)",
      text: "#20251c",
      muted: "rgba(32,37,28,0.60)",
      faint: "rgba(32,37,28,0.36)",
      line: "rgba(32,37,28,0.13)",
      accent: "#6f835f",
      accentSoft: "rgba(111,131,95,0.15)",
      gold: "#947a43",
      glow: "rgba(111,131,95,0.08)",
    },
  },
  {
    id: "ink",
    name: "ink",
    mode: "dark",
    description: "black, cream, faded brick",
    tokens: {
      bg: "#0b0b0c",
      bg2: "#141315",
      surface: "rgba(255,255,255,0.040)",
      surfaceStrong: "rgba(255,255,255,0.070)",
      text: "#f2eee7",
      muted: "rgba(242,238,231,0.58)",
      faint: "rgba(242,238,231,0.34)",
      line: "rgba(242,238,231,0.11)",
      accent: "#a65d55",
      accentSoft: "rgba(166,93,85,0.15)",
      gold: "#c8aa70",
      glow: "rgba(166,93,85,0.09)",
    },
  },
  {
    id: "plum",
    name: "plum",
    mode: "dark",
    description: "aubergine, mauve, ivory",
    tokens: {
      bg: "#140d17",
      bg2: "#211525",
      surface: "rgba(255,247,252,0.045)",
      surfaceStrong: "rgba(255,247,252,0.078)",
      text: "#f7eef5",
      muted: "rgba(247,238,245,0.58)",
      faint: "rgba(247,238,245,0.34)",
      line: "rgba(247,238,245,0.12)",
      accent: "#b783aa",
      accentSoft: "rgba(183,131,170,0.16)",
      gold: "#d0b985",
      glow: "rgba(183,131,170,0.10)",
    },
  },
  {
    id: "cobalt",
    name: "cobalt",
    mode: "dark",
    description: "deep blue, steel, pale gold",
    tokens: {
      bg: "#07111d",
      bg2: "#0d1d2e",
      surface: "rgba(239,246,255,0.045)",
      surfaceStrong: "rgba(239,246,255,0.078)",
      text: "#edf4ff",
      muted: "rgba(237,244,255,0.58)",
      faint: "rgba(237,244,255,0.34)",
      line: "rgba(237,244,255,0.12)",
      accent: "#7fa8d8",
      accentSoft: "rgba(127,168,216,0.16)",
      gold: "#c8a66c",
      glow: "rgba(127,168,216,0.10)",
    },
  },
];

export const FONT_OPTIONS = [
  {
    id: "kalam",
    name: "kalam",
    group: "handwritten",
    description: "grounded notebook handwriting",
    family: '"Kalam", "Patrick Hand", cursive',
  },
  {
    id: "patrick",
    name: "patrick hand",
    group: "handwritten",
    description: "clean, casual, very readable",
    family: '"Patrick Hand", "Kalam", cursive',
  },
  {
    id: "gaegu",
    name: "gaegu",
    group: "handwritten",
    description: "soft, cute, slightly imperfect",
    family: '"Gaegu", "Kalam", cursive',
  },
  {
    id: "caveat",
    name: "caveat",
    group: "handwritten",
    description: "pretty journal script",
    family: '"Caveat", "Kalam", cursive',
  },
  {
    id: "nanum",
    name: "nanum pen",
    group: "handwritten",
    description: "loose pen-note energy",
    family: '"Nanum Pen Script", "Kalam", cursive',
  },
  {
    id: "inter",
    name: "inter",
    group: "normal",
    description: "clean app sans",
    family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: "system",
    name: "system sans",
    group: "normal",
    description: "native phone UI feel",
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: "arial",
    name: "arial",
    group: "normal",
    description: "simple familiar sans serif",
    family: 'Arial, Helvetica, sans-serif',
  },
  {
    id: "verdana",
    name: "verdana",
    group: "normal",
    description: "rounded and readable",
    family: 'Verdana, Geneva, sans-serif',
  },
  {
    id: "trebuchet",
    name: "trebuchet",
    group: "normal",
    description: "warmer web sans",
    family: '"Trebuchet MS", Arial, sans-serif',
  },
];

export const LEVELS = [
  { level: 1, title: "just starting", minXp: 0 },
  { level: 2, title: "using what’s here", minXp: 100 },
  { level: 3, title: "cart pauser", minXp: 260 },
  { level: 4, title: "shelf regular", minXp: 480 },
  { level: 5, title: "empty maker", minXp: 760 },
  { level: 6, title: "steady buyer", minXp: 1100 },
  { level: 7, title: "less but better", minXp: 1500 },
];

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_RULES = [
  {
    id: "r-24-hour-cool-off",
    title: "24-hour cool-off before buying",
    detail: "pause every non-replacement beauty purchase for one full day",
    category: "all",
    active: true,
    createdAt: todayKey(),
  },
];

const DEFAULT_STATE = {
  xp: 0,
  currentStreak: 0,
  bestStreak: 0,
  noBuyStreak: 0,
  bestNoBuyStreak: 0,
  totalMoneySaved: 0,
  totalUrgesSurfed: 0,
  lastSurfDate: null,
  lastNoBuyDate: null,
  guideDismissed: false,
  themeId: "paper",
  fontId: "kalam",
  currency: DEFAULT_CURRENCY,
  products: [],
  vault: [],
  rules: DEFAULT_RULES,
  achievements: [],
  ritualLog: [],
};

function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomSavedAmount() {
  return Math.floor(Math.random() * 31) + 30;
}

function toMoney(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : randomSavedAmount();
}

function formatCurrencyAmount(value, currency = DEFAULT_CURRENCY) {
  const amount = numberOr(value, 0);
  const code = String(currency?.code || "").toUpperCase();

  if (code && code !== "CUSTOM" && /^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: code,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
    } catch {
      // fall through to symbol formatting
    }
  }

  const symbol = currency?.symbol || code || "¤";
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

  return `${symbol}${formatted}`;
}

function createLog(type, title, meta = {}) {
  return {
    id: uid(type),
    type,
    title,
    meta,
    createdAt: new Date().toISOString(),
  };
}

function calculateLevelInfo(xp) {
  const totalXp = Math.max(0, numberOr(xp));
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i += 1) {
    if (totalXp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }

  const progress = next
    ? Math.round(((totalXp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;

  return {
    ...current,
    next,
    totalXp,
    progress: clamp(progress, 0, 100),
    xpRemaining: next ? next.minXp - totalXp : 0,
    isMaxLevel: !next,
  };
}

function addAchievementOnce(existing, achievement) {
  if (existing.some((item) => item.id === achievement.id)) return existing;

  return [
    {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    },
    ...existing,
  ];
}

function normalizeProduct(product) {
  const status = product?.status === "empty" ? "empty" : "active";

  return {
    id: product?.id || uid("p"),
    name: String(product?.name || "untitled product"),
    brand: String(product?.brand || "").trim(),
    category: String(product?.category || "other"),
    shade: String(product?.shade || "not set"),
    price: Math.max(0, numberOr(product?.price, 0)),
    uses: Math.max(0, numberOr(product?.uses, 0)),
    status,
    createdAt: product?.createdAt || new Date().toISOString(),
    lastUsedAt: product?.lastUsedAt || null,
    emptiedAt: status === "empty" ? product?.emptiedAt || new Date().toISOString() : null,
  };
}

function normalizeVaultItem(item) {
  return {
    id: item?.id || uid("v"),
    productName: String(item?.productName || "unnamed product"),
    category: String(item?.category || "other"),
    price: Math.max(0, numberOr(item?.price, 0)),
    trigger: String(item?.trigger || "unspecified"),
    fantasySelf: String(item?.fantasySelf || "not named yet"),
    ownedAlternative: String(item?.ownedAlternative || "shop your stash first"),
    isReplacement: String(item?.isReplacement || "no"),
    ownsSimilar: String(item?.ownsSimilar || "maybe"),
    delay: String(item?.delay || "72 hours"),
    status: ["cooling", "released", "intentional"].includes(item?.status) ? item.status : "cooling",
    createdAt: item?.createdAt || new Date().toISOString(),
    decidedAt: item?.decidedAt || null,
  };
}


function normalizeCurrency(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_CURRENCY;

  const code = String(raw.code || "").trim().toUpperCase();
  const known = CURRENCIES.find((currency) => currency.code === code);

  if (known && !raw.custom) return known;

  const symbol = String(raw.symbol || code || "¤").trim().slice(0, 8) || "¤";
  const name = String(raw.name || code || "custom currency").trim().slice(0, 40) || "custom currency";

  return {
    code: code || "CUSTOM",
    symbol,
    name,
    custom: true,
  };
}

function normalizeFontId(rawFontId) {
  return FONT_OPTIONS.some((font) => font.id === rawFontId) ? rawFontId : DEFAULT_STATE.fontId;
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;

  const themeExists = THEMES.some((theme) => theme.id === raw.themeId);

  return {
    ...DEFAULT_STATE,
    ...raw,
    xp: numberOr(raw.xp, DEFAULT_STATE.xp),
    currentStreak: numberOr(raw.currentStreak, 0),
    bestStreak: numberOr(raw.bestStreak, 0),
    noBuyStreak: numberOr(raw.noBuyStreak, 0),
    bestNoBuyStreak: numberOr(raw.bestNoBuyStreak, 0),
    totalMoneySaved: numberOr(raw.totalMoneySaved, 0),
    totalUrgesSurfed: numberOr(raw.totalUrgesSurfed, 0),
    themeId: themeExists ? raw.themeId : DEFAULT_STATE.themeId,
    fontId: normalizeFontId(raw.fontId),
    currency: normalizeCurrency(raw.currency),
    products: Array.isArray(raw.products) ? raw.products.map(normalizeProduct) : [],
    vault: Array.isArray(raw.vault) ? raw.vault.map(normalizeVaultItem) : [],
    rules: Array.isArray(raw.rules) && raw.rules.length ? raw.rules : DEFAULT_RULES,
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    ritualLog: Array.isArray(raw.ritualLog) ? raw.ritualLog.slice(0, 40) : [],
    guideDismissed: Boolean(raw.guideDismissed),
  };
}

function isSameCategory(product, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [product.brand, product.name, product.category, product.shade]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

export function useAppState() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const [toast, setToast] = useState(null);
  const [urgeSession, setUrgeSession] = useState({
    isActive: false,
    countdown: 5,
    draft: {
      productName: "",
      category: "lipstick",
      price: "",
      trigger: "influenced",
      fantasySelf: "",
      ownedAlternative: "",
      isReplacement: "no",
      ownsSimilar: "maybe",
      delay: "72 hours",
    },
  });

  const stateRef = useRef(DEFAULT_STATE);
  const toastTimerRef = useRef(null);

  const commit = useCallback((updater) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  const showToast = useCallback((payload) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({
      id: uid("toast"),
      tone: "accent",
      ...payload,
    });

    toastTimerRef.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const levelInfo = useMemo(() => calculateLevelInfo(state.xp), [state.xp]);
  const theme = useMemo(
    () => THEMES.find((item) => item.id === state.themeId) || THEMES[0],
    [state.themeId]
  );

  const font = useMemo(
    () => FONT_OPTIONS.find((item) => item.id === state.fontId) || FONT_OPTIONS[0],
    [state.fontId]
  );

  const activeProducts = useMemo(
    () => state.products.filter((product) => product.status !== "empty"),
    [state.products]
  );

  const empties = useMemo(
    () => state.products.filter((product) => product.status === "empty"),
    [state.products]
  );

  const activeProduct = activeProducts[0] || null;

  const dashboardStats = useMemo(() => {
    const cooling = state.vault.filter((item) => item.status === "cooling");
    const released = state.vault.filter((item) => item.status === "released");
    const releasedTotal = released.reduce((sum, item) => sum + numberOr(item.price, 0), 0);
    const totalUses = state.products.reduce((sum, product) => sum + numberOr(product.uses, 0), 0);
    const activeShelfValue = activeProducts.reduce((sum, product) => sum + numberOr(product.price, 0), 0);
    const emptyShelfValue = empties.reduce((sum, product) => sum + numberOr(product.price, 0), 0);
    const totalShelfValue = activeShelfValue + emptyShelfValue;
    const pricedProductCount = state.products.filter((product) => numberOr(product.price, 0) > 0).length;

    return {
      coolingCount: cooling.length,
      releasedCount: released.length,
      releasedTotal,
      productCount: state.products.length,
      activeProductCount: activeProducts.length,
      emptyCount: empties.length,
      totalUses,
      activeShelfValue,
      emptyShelfValue,
      totalShelfValue,
      pricedProductCount,
      unpricedProductCount: Math.max(0, state.products.length - pricedProductCount),
      ruleCount: state.rules.filter((rule) => rule.active).length,
    };
  }, [activeProducts, empties, state.products, state.rules, state.vault]);

  const triggerInsights = useMemo(() => {
    const triggers = state.vault.reduce((acc, item) => {
      const key = item.trigger || "unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const categories = state.vault.reduce((acc, item) => {
      const key = item.category || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    return {
      topTrigger: topTrigger?.[0] || "not enough data",
      topCategory: topCategory?.[0] || "not enough data",
    };
  }, [state.vault]);

  const shopYourStash = useCallback(
    (query) => {
      const matches = state.products.filter((product) => isSameCategory(product, query));
      return matches.length ? matches : state.products.slice(0, 3);
    },
    [state.products]
  );

  const setTheme = useCallback((themeId) => {
    if (!THEMES.some((themeOption) => themeOption.id === themeId)) return;

    commit((current) => ({ ...current, themeId }));
  }, [commit]);

  const setFont = useCallback((fontId) => {
    if (!FONT_OPTIONS.some((fontOption) => fontOption.id === fontId)) return;

    commit((current) => ({ ...current, fontId }));
  }, [commit]);

  const setCurrency = useCallback((currencyDraft) => {
    const currency = normalizeCurrency(currencyDraft);

    commit((current) => ({ ...current, currency }));

    showToast({
      title: "currency updated",
      description: `prices now show in ${currency.name}`,
    });
  }, [commit, showToast]);

  const updateUrgeDraft = useCallback((field, value) => {
    setUrgeSession((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [field]: value,
      },
    }));
  }, []);

  const beginUrgeSurf = useCallback(() => {
    setUrgeSession((current) => {
      if (current.isActive) return current;
      return { ...current, isActive: true, countdown: 5 };
    });
  }, []);

  const cancelUrgeSurf = useCallback(() => {
    setUrgeSession((current) => ({ ...current, isActive: false, countdown: 5 }));
  }, []);

  const completeUrgeSurf = useCallback((draftOverride) => {
    const draft = draftOverride || urgeSession.draft;
    const savedAmount = toMoney(draft.price);
    const currency = stateRef.current.currency || DEFAULT_CURRENCY;
    const today = todayKey();

    commit((current) => {
      const previousLevel = calculateLevelInfo(current.xp);
      const nextXp = current.xp + XP.urgeSurf;
      const nextLevel = calculateLevelInfo(nextXp);
      const lastDate = current.lastSurfDate;
      const continuesStreak = lastDate === getYesterdayKey() || lastDate === today;
      const nextStreak = lastDate === today ? current.currentStreak : continuesStreak ? current.currentStreak + 1 : 1;

      let achievements = current.achievements;
      achievements = addAchievementOnce(achievements, {
        id: "first-cart-interrupted",
        title: "first cart interrupted",
        description: "you paused before buying",
      });

      if (nextStreak >= 7) {
        achievements = addAchievementOnce(achievements, {
          id: "seven-day-streak",
          title: "seven-day streak",
          description: "a full week of pausing before buying",
        });
      }

      if (nextLevel.level > previousLevel.level) {
        achievements = addAchievementOnce(achievements, {
          id: `level-${nextLevel.level}`,
          title: `level ${nextLevel.level}: ${nextLevel.title}`,
          description: "you moved up a level",
        });
      }

      const shouldAddVaultItem = String(draft.productName || "").trim().length > 0;
      const vaultItem = shouldAddVaultItem
        ? normalizeVaultItem({
            id: uid("v"),
            productName: draft.productName.trim(),
            category: draft.category || "other",
            price: savedAmount,
            trigger: draft.trigger || "unspecified",
            fantasySelf: draft.fantasySelf?.trim() || "not named yet",
            ownedAlternative: draft.ownedAlternative?.trim() || "shop your stash first",
            isReplacement: draft.isReplacement || "no",
            ownsSimilar: draft.ownsSimilar || "maybe",
            delay: draft.delay || "72 hours",
            status: "cooling",
            createdAt: new Date().toISOString(),
          })
        : null;

      return {
        ...current,
        xp: nextXp,
        currentStreak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        totalMoneySaved: current.totalMoneySaved + savedAmount,
        totalUrgesSurfed: current.totalUrgesSurfed + 1,
        lastSurfDate: today,
        vault: vaultItem ? [vaultItem, ...current.vault] : current.vault,
        achievements,
        ritualLog: [
          createLog("urge", "urge surfed", {
            savedAmount,
            xpGain: XP.urgeSurf,
            productName: draft.productName || "unnamed urge",
          }),
          ...current.ritualLog,
        ].slice(0, 40),
      };
    });

    setUrgeSession({
      isActive: false,
      countdown: 5,
      draft: {
        productName: "",
        category: draft.category || "lipstick",
        price: "",
        trigger: draft.trigger || "influenced",
        fantasySelf: "",
        ownedAlternative: "",
        isReplacement: draft.isReplacement || "no",
        ownsSimilar: draft.ownsSimilar || "maybe",
        delay: draft.delay || "72 hours",
      },
    });

    showToast({
      title: "urge surfed",
      description: `cart paused · +${formatCurrencyAmount(savedAmount, currency)} kept · +${XP.urgeSurf} XP`,
    });
  }, [commit, showToast, urgeSession.draft]);

  const addProduct = useCallback((draft) => {
    const product = normalizeProduct({
      id: uid("p"),
      name: draft.name,
      brand: draft.brand,
      category: draft.category,
      shade: draft.shade,
      price: draft.price,
      uses: draft.uses,
      status: "active",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    });

    commit((current) => ({
      ...current,
      xp: current.xp + XP.addProduct,
      products: [product, ...current.products],
      ritualLog: [
        createLog("product-add", "stash item added", {
          productName: product.name,
          xpGain: XP.addProduct,
        }),
        ...current.ritualLog,
      ].slice(0, 40),
    }));

    showToast({
      title: "added to shelf",
      description: `${product.name} is ready to use · +${XP.addProduct} XP`,
    });
  }, [commit, showToast]);

  const updateProduct = useCallback((productId, draft) => {
    const product = stateRef.current.products.find((item) => item.id === productId);
    if (!product) return;

    const nextProduct = normalizeProduct({
      ...product,
      name: draft.name,
      brand: draft.brand,
      category: draft.category,
      shade: draft.shade,
      price: draft.price,
      uses: draft.uses,
    });

    commit((current) => ({
      ...current,
      products: current.products.map((item) =>
        item.id === productId ? nextProduct : item
      ),
    }));

    showToast({
      title: "product updated",
      description: `${nextProduct.name} was saved`,
    });
  }, [commit, showToast]);

  const deleteProduct = useCallback((productId) => {
    const product = stateRef.current.products.find((item) => item.id === productId);
    if (!product) return;

    commit((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
    }));

    showToast({
      title: "product deleted",
      description: `${product.name} was removed from your shelf`,
    });
  }, [commit, showToast]);

  const logProductUse = useCallback((productId) => {
    const product = stateRef.current.products.find((item) => item.id === productId);
    if (!product || product.status === "empty") return;

    commit((current) => {
      const previousLevel = calculateLevelInfo(current.xp);
      const nextXp = current.xp + XP.productUse;
      const nextLevel = calculateLevelInfo(nextXp);

      let achievements = current.achievements;
      if (nextLevel.level > previousLevel.level) {
        achievements = addAchievementOnce(achievements, {
          id: `level-${nextLevel.level}`,
          title: `level ${nextLevel.level}: ${nextLevel.title}`,
          description: "you moved up a level",
        });
      }

      return {
        ...current,
        xp: nextXp,
        products: current.products.map((item) =>
          item.id === productId ? { ...item, uses: item.uses + 1, lastUsedAt: new Date().toISOString() } : item
        ),
        achievements,
      };
    });

    showToast({
      title: "+1 use logged",
      description: `${product.name} · +${XP.productUse} XP`,
    });
  }, [commit, showToast]);

  const addPastProductUses = useCallback((productId, amount) => {
    const product = stateRef.current.products.find((item) => item.id === productId);
    const usesToAdd = Math.max(0, Math.floor(numberOr(amount, 0)));

    if (!product || product.status === "empty" || usesToAdd <= 0) return;

    commit((current) => ({
      ...current,
      products: current.products.map((item) =>
        item.id === productId ? { ...item, uses: item.uses + usesToAdd } : item
      ),
    }));

    showToast({
      title: "past uses added",
      description: `${product.name} +${usesToAdd} previous use${usesToAdd === 1 ? "" : "s"} · no XP backfilled`,
    });
  }, [commit, showToast]);

  const markProductEmpty = useCallback((productId) => {
    const product = stateRef.current.products.find((item) => item.id === productId);
    if (!product || product.status === "empty") return;

    commit((current) => {
      let achievements = current.achievements;
      achievements = addAchievementOnce(achievements, {
        id: `empty-${product.id}`,
        title: "empty",
        description: `${product.name} was finished before replacing`,
      });

      return {
        ...current,
        xp: current.xp + XP.emptyBonus,
        products: current.products.map((item) =>
          item.id === productId
            ? { ...item, status: "empty", emptiedAt: new Date().toISOString() }
            : item
        ),
        achievements,
        ritualLog: [
          createLog("empty", "product marked empty", {
            productName: product.name,
            xpGain: XP.emptyBonus,
            uses: product.uses,
          }),
          ...current.ritualLog,
        ].slice(0, 40),
      };
    });

    showToast({
      tone: "gold",
      title: "empty logged",
      description: `${product.name} is finished · +${XP.emptyBonus} XP`,
    });
  }, [commit, showToast]);

  const decideVaultItem = useCallback((vaultId, decision) => {
    const item = stateRef.current.vault.find((entry) => entry.id === vaultId);
    if (!item) return;

    const currency = stateRef.current.currency || DEFAULT_CURRENCY;

    commit((current) => {
      const isRelease = decision === "released" && item.status !== "released";
      const savedAmount = isRelease ? numberOr(item.price, 0) : 0;
      const xpGain = isRelease ? XP.vaultRelease : 0;

      let achievements = current.achievements;
      if (isRelease) {
        achievements = addAchievementOnce(achievements, {
          id: "first-release",
          title: "released, not bought",
          description: "you let an impulse expire",
        });
      }

      return {
        ...current,
        xp: current.xp + xpGain,
        totalMoneySaved: current.totalMoneySaved + savedAmount,
        vault: current.vault.map((entry) =>
          entry.id === vaultId
            ? { ...entry, status: decision, decidedAt: new Date().toISOString() }
            : entry
        ),
        achievements,
        ritualLog: [
          createLog("vault", decision === "released" ? "purchase released" : "purchase updated", {
            productName: item.productName,
            decision,
            savedAmount,
            xpGain,
          }),
          ...current.ritualLog,
        ].slice(0, 40),
      };
    });

    showToast({
      tone: decision === "released" ? "gold" : "accent",
      title: decision === "released" ? "released" : decision,
      description:
        decision === "released"
          ? `${item.productName} removed · +${formatCurrencyAmount(item.price, currency)} kept`
          : `${item.productName} updated`,
    });
  }, [commit, showToast]);

  const completeNoBuyDay = useCallback(() => {
    const today = todayKey();

    if (stateRef.current.lastNoBuyDate === today) {
      showToast({
        title: "already logged",
        description: "today is already marked as a no-buy day",
      });
      return;
    }

    const toastStreak = stateRef.current.lastNoBuyDate === getYesterdayKey() ? stateRef.current.noBuyStreak + 1 : 1;

    commit((current) => {
      const yesterday = getYesterdayKey();
      const continues = current.lastNoBuyDate === yesterday;
      const nextStreak = continues ? current.noBuyStreak + 1 : 1;

      let achievements = current.achievements;
      achievements = addAchievementOnce(achievements, {
        id: "first-no-buy-day",
        title: "first no-buy day",
        description: "you ended the day without an impulse beauty buy",
      });

      if (nextStreak >= 7) {
        achievements = addAchievementOnce(achievements, {
          id: "seven-no-buy-days",
          title: "7 no-buy days",
          description: "one week of choosing pause over impulse",
        });
      }

      return {
        ...current,
        xp: current.xp + XP.noBuyDay,
        noBuyStreak: nextStreak,
        bestNoBuyStreak: Math.max(current.bestNoBuyStreak, nextStreak),
        lastNoBuyDate: today,
        achievements,
        ritualLog: [
          createLog("no-buy", "no-buy day completed", { xpGain: XP.noBuyDay, streak: nextStreak }),
          ...current.ritualLog,
        ].slice(0, 40),
      };
    });

    showToast({
      title: `day ${toastStreak} logged`,
      description: `no impulse beauty buy · +${XP.noBuyDay} XP`,
    });
  }, [commit, showToast]);

  const toggleRule = useCallback((ruleId) => {
    commit((current) => ({
      ...current,
      rules: current.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      ),
    }));
  }, [commit]);

  const dismissGuide = useCallback(() => {
    commit((current) => ({ ...current, guideDismissed: true }));
  }, [commit]);

  const resetAll = useCallback(() => {
    commit({
      ...DEFAULT_STATE,
      rules: DEFAULT_RULES.map((rule) => ({ ...rule, createdAt: todayKey() })),
    });
    showToast({
      title: "reset complete",
      description: "Deja Pan is back to a fresh start",
    });
  }, [commit, showToast]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const legacyV4 = window.localStorage.getItem("deja-pan-state-v4");
      const legacyV3 = window.localStorage.getItem("deja-pan-state-v3");
      const legacyV1 = window.localStorage.getItem("deja-pan-state-v1");
      const parsed = stored ? JSON.parse(stored) : legacyV4 ? JSON.parse(legacyV4) : legacyV3 ? JSON.parse(legacyV3) : legacyV1 ? JSON.parse(legacyV1) : null;
      const normalized = normalizeState(parsed);
      stateRef.current = normalized;
      setState(normalized);
    } catch {
      stateRef.current = DEFAULT_STATE;
      setState(DEFAULT_STATE);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    stateRef.current = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!urgeSession.isActive) return;

    if (urgeSession.countdown <= 0) {
      completeUrgeSurf();
      return;
    }

    const timer = setTimeout(() => {
      setUrgeSession((current) => ({
        ...current,
        countdown: current.countdown - 1,
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [completeUrgeSurf, urgeSession.countdown, urgeSession.isActive]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return {
    hydrated,
    state,
    theme,
    themes: THEMES,
    font,
    fonts: FONT_OPTIONS,
    currency: state.currency,
    currencies: CURRENCIES,
    xp: state.xp,
    levels: LEVELS,
    xpRewards: XP,
    levelInfo,
    activeProducts,
    activeProduct,
    empties,
    dashboardStats,
    triggerInsights,
    urgeSession,
    toast,
    shopYourStash,
    updateUrgeDraft,
    beginUrgeSurf,
    cancelUrgeSurf,
    completeUrgeSurf,
    addProduct,
    updateProduct,
    deleteProduct,
    logProductUse,
    addPastProductUses,
    markProductEmpty,
    decideVaultItem,
    completeNoBuyDay,
    toggleRule,
    dismissGuide,
    resetAll,
    dismissToast,
    setTheme,
    setFont,
    setCurrency,
  };
}

export default useAppState;
