"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/hooks/useAppState";

const ease = [0.22, 1, 0.36, 1];

const TRIGGERS = [
  "influenced",
  "sale panic",
  "limited edition panic",
  "bored",
  "stressed",
  "sad",
  "comparison",
  "reward-seeking",
  "new identity fantasy",
  "running out",
  "occasion",
  "curious",
];

const REPLACEMENT_OPTIONS = [
  ["yes", "yes, replacing an empty"],
  ["no", "no, it is extra"],
  ["not sure", "not sure"],
];

const SIMILAR_OPTIONS = [
  ["yes", "yes"],
  ["maybe", "maybe"],
  ["no", "no"],
];

const DELAY_OPTIONS = ["24 hours", "72 hours", "7 days"];

const CATEGORY_GROUPS = [
  {
    label: "lips",
    options: ["lipstick", "lip tint / stain", "lip gloss / oil", "lip liner", "lip balm"],
  },
  {
    label: "face base",
    options: ["foundation / skin tint", "concealer", "primer", "powder", "setting spray"],
  },
  {
    label: "cheeks",
    options: ["blush", "bronzer / contour", "highlighter"],
  },
  {
    label: "eyes",
    options: ["eyeshadow", "eyeliner", "mascara", "brow product", "lashes"],
  },
  {
    label: "skin, scent, body",
    options: ["sunscreen", "cleanser", "moisturizer", "serum / treatment", "toner / essence", "face mask", "perfume", "body mist", "body care", "hair care"],
  },
  {
    label: "tools & extras",
    options: ["brush", "sponge / puff", "makeup tool", "nails", "other"],
  },
];

const CATEGORY_OPTIONS = CATEGORY_GROUPS.flatMap((group) => group.options);

const LEGACY_CATEGORY_LABELS = {
  lip: "lip product",
  base: "base product",
  eyes: "eye product",
  skincare: "skincare",
  tools: "tools",
};

const EMPTY_PRODUCT_DRAFT = { name: "", brand: "", category: "lipstick", shade: "", price: "", uses: "" };

function displayCategory(category) {
  return LEGACY_CATEGORY_LABELS[category] || category || "other";
}

const CATEGORY_SECTION_LABELS = {
  lips: "lippies",
  "face base": "base",
  cheeks: "cheeks",
  eyes: "eyes",
  "skin, scent, body": "skin, scent, body",
  "tools & extras": "tools & extras",
};

function getCategorySection(category) {
  const normalized = String(category || "").toLowerCase();

  for (const group of CATEGORY_GROUPS) {
    if (group.options.some((option) => option.toLowerCase() === normalized)) {
      return CATEGORY_SECTION_LABELS[group.label] || group.label;
    }
  }

  if (["lip", "lip product"].includes(normalized)) return "lippies";
  if (["blush", "bronzer", "contour", "highlighter"].includes(normalized)) return "cheeks";
  if (["base", "base product"].includes(normalized)) return "base";
  if (["skincare"].includes(normalized)) return "skin, scent, body";
  if (["tools"].includes(normalized)) return "tools & extras";

  return "other";
}

function groupShelfProducts(products) {
  const order = ["lippies", "base", "cheeks", "eyes", "skin, scent, body", "tools & extras", "other"];
  const groups = products.reduce((acc, product) => {
    const section = getCategorySection(product.category);
    if (!acc[section]) acc[section] = [];
    acc[section].push(product);
    return acc;
  }, {});

  return order
    .filter((section) => groups[section]?.length)
    .map((section) => ({ section, products: groups[section] }));
}

function CategorySelectOptions({ value }) {
  const isLegacyValue = value && !CATEGORY_OPTIONS.includes(value);

  return (
    <>
      {isLegacyValue ? <option value={value}>{displayCategory(value)}</option> : null}
      {CATEGORY_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value, currency) {
  const amount = Number(value || 0);
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

function getRealityCheck(price, currency) {
  const amount = Number(price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const twoUses = amount / 2;
  const fiveUses = amount / 5;

  return {
    headline: `${formatMoney(amount, currency)} is still ${formatMoney(amount, currency)} if it sits unused.`,
    line: `If you use it twice, that is ${formatMoney(twoUses, currency)}/use. Five uses brings it to ${formatMoney(fiveUses, currency)}/use.`,
  };
}

function findShelfMatches(products, draft) {
  const category = String(draft.category || "").toLowerCase();
  const query = String(draft.productName || "").toLowerCase();
  const queryWords = query.split(/\s+/).filter((word) => word.length >= 4);

  return products
    .filter((product) => product.status !== "empty")
    .filter((product) => {
      const haystack = [product.brand, product.name, product.category, product.shade].join(" ").toLowerCase();
      return haystack.includes(category) || queryWords.some((word) => haystack.includes(word));
    })
    .slice(0, 3);
}

function costPerUse(product) {
  if (!product?.price || !product?.uses) return null;
  return product.price / product.uses;
}

function formatRelativeDate(value) {
  if (!value) return "not used yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not used yet";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "used today";
  if (diffDays === 1) return "used yesterday";
  if (diffDays < 7) return `used ${diffDays} days ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function initials(name = "") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "•";
}

function themeVars(theme) {
  return {
    "--bg": theme.tokens.bg,
    "--bg-2": theme.tokens.bg2,
    "--surface": theme.tokens.surface,
    "--surface-strong": theme.tokens.surfaceStrong,
    "--text": theme.tokens.text,
    "--muted": theme.tokens.muted,
    "--faint": theme.tokens.faint,
    "--line": theme.tokens.line,
    "--accent": theme.tokens.accent,
    "--accent-soft": theme.tokens.accentSoft,
    "--gold": theme.tokens.gold,
    "--glow": theme.tokens.glow,
  };
}

function fontVars(font) {
  const family = font?.family || '"Kalam", "Patrick Hand", cursive';

  return {
    "--font-app": family,
    "--font-handwriting": family,
  };
}

function Card({ children, className = "", delay = 0, style, ...props }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease }}
      className={cn("rounded-[1.35rem] border p-4", className)}
      style={{ borderColor: "var(--line)", background: "var(--surface)", ...style }}
      {...props}
    >
      {children}
    </motion.article>
  );
}

function SectionTitle({ eyebrow, title, copy, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-[1.65rem] font-normal leading-tight tracking-[-0.04em]">{title}</h2>
        {copy && <p className="mt-2 max-w-[22rem] text-sm leading-6" style={{ color: "var(--muted)" }}>{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs" style={{ color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:opacity-45",
        props.className
      )}
      style={{ borderColor: "var(--line)", background: "var(--surface-strong)", color: "var(--text)" }}
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none", props.className)}
      style={{ borderColor: "var(--line)", background: "var(--surface-strong)", color: "var(--text)" }}
    />
  );
}

function PrimaryButton({ children, disabled, className, ...props }) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.985 }}
      disabled={disabled}
      className={cn("rounded-full px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-45", className)}
      style={{ background: "var(--accent)", color: "var(--bg)" }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function GhostButton({ children, active = false, disabled = false, className, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn("rounded-full border px-3.5 py-2.5 text-sm transition disabled:opacity-45", className)}
      style={{
        borderColor: active ? "var(--accent)" : "var(--line)",
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--text)" : "var(--muted)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function Shell({ theme, font, children }) {
  return (
    <main
      className="deja-pan-root relative min-h-[100dvh] overflow-hidden"
      style={{ ...themeVars(theme), ...fontVars(font), background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: "linear-gradient(180deg, var(--glow), transparent 18rem)" }} />
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[470px] px-5 pb-28 pt-5 sm:px-6">
        {children}
      </div>
    </main>
  );
}

function AppHeader({ onReset, onOpenGuide, onOpenTheme, onOpenLevels }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease }}
      className="pb-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p data-hand-font="true" className="text-[1.65rem] leading-none tracking-[-0.06em]">déjà pan</p>
        <div className="flex flex-wrap justify-end gap-2">
          <GhostButton onClick={onOpenGuide} className="px-3 py-2 text-xs">guide</GhostButton>
          <GhostButton onClick={onOpenTheme} className="px-3 py-2 text-xs">style</GhostButton>
          <GhostButton onClick={onOpenLevels} className="px-3 py-2 text-xs">levels</GhostButton>
          <GhostButton onClick={onReset} className="px-3 py-2 text-xs">reset</GhostButton>
        </div>
      </div>
    </motion.header>
  );
}

function ThemePicker({ themes, themeId, onSetTheme, compact = false }) {
  const lightThemes = themes.filter((theme) => theme.mode === "light");
  const darkThemes = themes.filter((theme) => theme.mode === "dark");

  function ThemeButton({ theme }) {
    return (
      <button
        type="button"
        onClick={() => onSetTheme(theme.id)}
        className="rounded-[1.1rem] border p-3 text-left transition"
        style={{
          borderColor: themeId === theme.id ? "var(--accent)" : "var(--line)",
          background: themeId === theme.id ? "var(--accent-soft)" : "transparent",
        }}
      >
        <span className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm">{theme.name}</span>
            <span className="mt-1 block text-xs leading-4" style={{ color: "var(--muted)" }}>{theme.description}</span>
          </span>
          <span className="flex shrink-0 -space-x-1">
            {[theme.tokens.bg, theme.tokens.bg2, theme.tokens.accent].map((color, index) => (
              <span key={`${theme.id}-${index}`} className="h-5 w-5 rounded-full border" style={{ background: color, borderColor: "var(--line)" }} />
            ))}
          </span>
        </span>
      </button>
    );
  }

  return (
    <Card delay={0.03} className={compact ? "border-0 p-0" : "mb-4"} style={compact ? { background: "transparent" } : undefined}>
      {!compact && <SectionTitle eyebrow="themes" title="pick a color mood" copy="Three light modes, three dark modes. Less sameness, more actual choice." />}
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs" style={{ color: "var(--faint)" }}>light</p>
          <div className="grid grid-cols-1 gap-2">
            {lightThemes.map((theme) => <ThemeButton key={theme.id} theme={theme} />)}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs" style={{ color: "var(--faint)" }}>dark</p>
          <div className="grid grid-cols-1 gap-2">
            {darkThemes.map((theme) => <ThemeButton key={theme.id} theme={theme} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function FontPicker({ fonts, fontId, onSetFont }) {
  const groups = [
    { id: "handwritten", title: "handwritten", items: fonts.filter((font) => font.group === "handwritten") },
    { id: "normal", title: "normal", items: fonts.filter((font) => font.group === "normal") },
  ];

  return (
    <div className="mt-5 space-y-5">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-xs" style={{ color: "var(--faint)" }}>{group.title}</p>
          <div className="grid grid-cols-1 gap-2">
            {group.items.map((font) => (
              <button
                key={font.id}
                type="button"
                data-font-preview="true"
                onClick={() => onSetFont(font.id)}
                className="rounded-[1.1rem] border p-3 text-left transition"
                style={{
                  borderColor: fontId === font.id ? "var(--accent)" : "var(--line)",
                  background: fontId === font.id ? "var(--accent-soft)" : "transparent",
                  fontFamily: font.family,
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-[1.25rem] leading-none">{font.name}</span>
                    <span className="mt-1 block text-sm leading-5" style={{ color: "var(--muted)" }}>{font.description}</span>
                  </span>
                  <span className="shrink-0 text-lg" style={{ color: "var(--accent)" }}>Aa</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalShell({ open, onClose, eyebrow, title, copy, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.32)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 26 }}
            transition={{ duration: 0.32, ease }}
            className="max-h-[88dvh] w-full max-w-[460px] overflow-y-auto rounded-[1.5rem] border p-5 shadow-2xl"
            style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--text)" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {eyebrow && (
                  <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
                    {eyebrow}
                  </p>
                )}
                <h2 className="mt-1 text-[1.65rem] font-normal leading-tight tracking-[-0.04em]">{title}</h2>
                {copy && <p className="mt-2 max-w-[22rem] text-sm leading-6" style={{ color: "var(--muted)" }}>{copy}</p>}
              </div>
              <GhostButton onClick={onClose}>close</GhostButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GuideModal({ open, state, dashboardStats, onAddProduct, onClose, onGoShelf }) {
  const steps = [
    {
      title: "add one thing you already own",
      detail: "Not the whole drawer. Start with one lipstick, blush, perfume, or base product you want to notice again.",
      done: dashboardStats.productCount > 0,
      action: onAddProduct,
      cta: "add",
    },
    {
      title: "log uses only in shelf",
      detail: "Every use lowers cost-per-use and makes the product feel less forgotten. No targets, no pressure.",
      done: dashboardStats.totalUses > 0,
      action: onGoShelf,
      cta: "open shelf",
    },
    {
      title: "open home before checkout",
      detail: "When something feels urgent, pause it, check what triggered it, and decide later instead of on autopilot.",
      done: state.totalUrgesSurfed > 0,
      action: onClose,
      cta: "got it",
    },
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="guide"
      title="how déjà pan works"
      copy="A tiny anti-overbuying loop: use what is already here, pause what feels urgent, and keep proof that you did not give in."
    >
      <div className="space-y-2">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={step.action}
            className="grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left"
            style={{ borderColor: "var(--line)", background: step.done ? "var(--accent-soft)" : "var(--surface)" }}
          >
            <span className="text-sm" style={{ color: step.done ? "var(--accent)" : "var(--faint)" }}>{step.done ? "✓" : index + 1}</span>
            <span>
              <span className="block text-sm">{step.title}</span>
              <span className="mt-1 block text-xs leading-5" style={{ color: "var(--muted)" }}>{step.detail}</span>
            </span>
            <span className="text-xs whitespace-nowrap" style={{ color: "var(--faint)" }}>{step.cta}</span>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function ThemeModal({ open, themes, themeId, onSetTheme, fonts, fontId, onSetFont, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="style"
      title="pick the vibe"
      copy="Choose a color mood and font style. You can change this anytime."
    >
      <ThemePicker themes={themes} themeId={themeId} onSetTheme={onSetTheme} compact />
      <FontPicker fonts={fonts} fontId={fontId} onSetFont={onSetFont} />
    </ModalShell>
  );
}

function LevelsModal({ open, levels, levelInfo, xp, xpRewards, onClose }) {
  const earnRows = [
    ["log a real use", xpRewards.productUse],
    ["pause a cart", xpRewards.urgeSurf],
    ["log a no-buy day", xpRewards.noBuyDay],
    ["release a paused buy", xpRewards.vaultRelease],
    ["mark an empty", xpRewards.emptyBonus],
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="levels"
      title="where your XP goes"
      copy="Levels are just a little push to keep opening the app before buying. Past uses can be backfilled, but only real new actions earn XP."
    >
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface-strong)" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm">level {levelInfo.level} · {levelInfo.title}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {levelInfo.isMaxLevel ? `${xp} XP` : `${xp} XP · ${levelInfo.xpRemaining} to next`}
            </p>
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{levelInfo.progress}%</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--accent)" }}
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 0.55, ease }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {levels.map((level) => {
          const isCurrent = level.level === levelInfo.level;
          const isUnlocked = xp >= level.minXp;

          return (
            <div
              key={level.level}
              className="flex items-center justify-between gap-4 rounded-2xl border p-3"
              style={{
                borderColor: isCurrent ? "var(--accent)" : "var(--line)",
                background: isCurrent ? "var(--accent-soft)" : "var(--surface)",
                opacity: isUnlocked ? 1 : 0.62,
              }}
            >
              <div>
                <p className="text-sm">level {level.level} · {level.title}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{level.minXp} XP</p>
              </div>
              <span className="text-xs" style={{ color: isUnlocked ? "var(--accent)" : "var(--faint)" }}>
                {isCurrent ? "current" : isUnlocked ? "unlocked" : "locked"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <p className="text-sm">earn XP by doing the actual helpful stuff</p>
        <div className="mt-3 space-y-2">
          {earnRows.map(([label, points]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <span>+{points} XP</span>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function ResetConfirmModal({ open, onClose, onConfirm }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="reset"
      title="start over?"
      copy="This clears your shelf, paused cart, streaks, wins, XP, and local history on this browser."
    >
      <div className="grid grid-cols-2 gap-3">
        <GhostButton onClick={onClose} className="w-full py-3">keep my data</GhostButton>
        <PrimaryButton
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="w-full py-3"
        >
          yes, reset
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}

function CurrencyPicker({ currency, currencies, onSetCurrency, compact = false }) {
  const selected = currencies.some((item) => item.code === currency?.code && !currency?.custom)
    ? currency.code
    : "CUSTOM";

  const [customDraft, setCustomDraft] = useState({
    code: currency?.code || "CUSTOM",
    symbol: currency?.symbol || "¤",
    name: currency?.name || "custom currency",
  });

  useEffect(() => {
    setCustomDraft({
      code: currency?.code || "CUSTOM",
      symbol: currency?.symbol || "¤",
      name: currency?.name || "custom currency",
    });
  }, [currency?.code, currency?.symbol, currency?.name]);

  function chooseCurrency(value) {
    if (value === "CUSTOM") {
      onSetCurrency({ ...customDraft, custom: true });
      return;
    }

    const next = currencies.find((item) => item.code === value);
    if (next) onSetCurrency(next);
  }

  function updateCustom(field, value) {
    setCustomDraft((current) => ({ ...current, [field]: value }));
  }

  function applyCustom() {
    onSetCurrency({
      code: customDraft.code.trim().toUpperCase() || "CUSTOM",
      symbol: customDraft.symbol.trim() || "¤",
      name: customDraft.name.trim() || customDraft.code.trim().toUpperCase() || "custom currency",
      custom: true,
    });
  }

  return (
    <Card delay={0.03} className={compact ? "border-0 p-0" : "mt-4"} style={compact ? { background: "transparent" } : undefined}>
      {!compact && <SectionTitle eyebrow="currency" title="set your money" copy="Prices are stored as the currency you choose. No conversion, no dollar default." />}
      <div className="space-y-3">
        <Field label="currency">
          <SelectInput value={selected} onChange={(event) => chooseCurrency(event.target.value)}>
            {currencies.map((item) => (
              <option key={item.code} value={item.code}>
                {item.symbol} {item.code} · {item.name}
              </option>
            ))}
            <option value="CUSTOM">custom</option>
          </SelectInput>
        </Field>

        {selected === "CUSTOM" && (
          <div className="grid grid-cols-[1fr_0.8fr] gap-3">
            <Field label="code / name">
              <TextInput value={customDraft.code} onChange={(event) => updateCustom("code", event.target.value)} placeholder="INR" />
            </Field>
            <Field label="symbol">
              <TextInput value={customDraft.symbol} onChange={(event) => updateCustom("symbol", event.target.value)} placeholder="₹" />
            </Field>
            <div className="col-span-2">
              <Field label="display name">
                <TextInput value={customDraft.name} onChange={(event) => updateCustom("name", event.target.value)} placeholder="my currency" />
              </Field>
              <PrimaryButton onClick={applyCustom} className="mt-3 w-full">save currency</PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function StarterGuide({ state, dashboardStats, onAddProduct, onClose, onGoShelf }) {
  const steps = [
    {
      title: "add one product",
      detail: "Pick one thing you already own. Not your whole drawer.",
      done: dashboardStats.productCount > 0,
      action: onAddProduct,
      cta: "add",
    },
    {
      title: "log uses",
      detail: "Tap log use when you wear it. No targets, no fake deadlines.",
      done: dashboardStats.totalUses > 0,
      action: onGoShelf,
      cta: "shelf",
    },
    {
      title: "pause buys",
      detail: "When you want something new, log the urge and let it cool.",
      done: state.totalUrgesSurfed > 0,
      action: onClose,
      cta: "ok",
    },
  ];

  return (
    <Card delay={0.04} className="mb-4" style={{ background: "var(--surface-strong)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm">start here</p>
          <p className="mt-2 max-w-[20rem] text-sm leading-6" style={{ color: "var(--muted)" }}>
            Deja Pan is meant to be small. Add one product, use it, and pause the next impulse.
          </p>
        </div>
        <GhostButton onClick={onClose} className="px-3 py-2 text-xs">close</GhostButton>
      </div>

      <div className="mt-5 space-y-2">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={step.action}
            className="grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left"
            style={{ borderColor: "var(--line)", background: step.done ? "var(--accent-soft)" : "transparent" }}
          >
            <span className="text-sm" style={{ color: step.done ? "var(--accent)" : "var(--faint)" }}>{step.done ? "✓" : index + 1}</span>
            <span>
              <span className="block text-sm">{step.title}</span>
              <span className="mt-1 block text-xs leading-5" style={{ color: "var(--muted)" }}>{step.detail}</span>
            </span>
            <span className="text-xs" style={{ color: "var(--faint)" }}>{step.cta}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function MetricRow({ state, dashboardStats, currency }) {
  const metrics = [
    { label: "no-buy streak", value: `${state.noBuyStreak || 0}d` },
    { label: "kept", value: formatMoney(state.totalMoneySaved, currency) },
    { label: "paused", value: dashboardStats.coolingCount + dashboardStats.releasedCount },
  ];

  return (
    <section className="grid grid-cols-3 gap-2">
      {metrics.map((metric, index) => (
        <Card key={metric.label} delay={0.05 + index * 0.025} className="p-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>{metric.label}</p>
          <p className="mt-2 text-[1.65rem] font-normal tracking-[-0.06em]">{metric.value}</p>
        </Card>
      ))}
    </section>
  );
}

function LevelStrip({ xp, levelInfo }) {
  return (
    <Card delay={0.12} className="mt-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">level {levelInfo.level} · {levelInfo.title}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {levelInfo.isMaxLevel ? `${xp} XP` : `${xp} XP · ${levelInfo.xpRemaining} to next`}
          </p>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{levelInfo.progress}%</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-strong)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${levelInfo.progress}%` }}
          transition={{ duration: 0.55, ease }}
        />
      </div>
    </Card>
  );
}

function HomeHero({ state, dashboardStats, currency, onCompleteNoBuy, onGoShelf }) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const doneToday = state.lastNoBuyDate === todayString;
  const hasStreak = Number(state.noBuyStreak || 0) > 0;

  const headline = doneToday
    ? `day ${state.noBuyStreak || 1} is counted.`
    : hasStreak
      ? `day ${state.noBuyStreak + 1} starts with not buying.`
      : "do not buy it yet.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.44, ease }}
      className="rounded-[1.7rem] border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface-strong)" }}
    >
      <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>home</p>
      <h1 data-hand-font="true" className="mt-3 max-w-[20rem] text-[3.15rem] font-normal leading-[0.86] tracking-[-0.065em]">
        {headline}
      </h1>
      <p className="mt-4 max-w-[22rem] text-sm leading-6" style={{ color: "var(--muted)" }}>
        Open this before checkout. Count the day, pause the urge, or go use something you already own.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <p className="text-[0.7rem]" style={{ color: "var(--muted)" }}>kept</p>
          <p className="mt-1 text-lg tracking-[-0.05em]">{formatMoney(state.totalMoneySaved, currency)}</p>
        </div>
        <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <p className="text-[0.7rem]" style={{ color: "var(--muted)" }}>best</p>
          <p className="mt-1 text-lg tracking-[-0.05em]">{state.bestNoBuyStreak || 0}d</p>
        </div>
        <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <p className="text-[0.7rem]" style={{ color: "var(--muted)" }}>paused</p>
          <p className="mt-1 text-lg tracking-[-0.05em]">{dashboardStats.coolingCount + dashboardStats.releasedCount}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <PrimaryButton onClick={onCompleteNoBuy} disabled={doneToday} className="py-3">
          {doneToday ? "today counted" : "log today as no-buy"}
        </PrimaryButton>
        <GhostButton onClick={onGoShelf} className="px-4 py-3">shelf</GhostButton>
      </div>
    </motion.section>
  );
}

function HomeProgressCard({ xp, levelInfo, onOpenLevels }) {
  return (
    <Card delay={0.2} className="mt-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs" style={{ color: "var(--faint)" }}>progress</p>
          <p className="mt-1 text-sm">level {levelInfo.level} · {levelInfo.title}</p>
        </div>
        <button type="button" onClick={onOpenLevels} className="text-xs" style={{ color: "var(--muted)" }}>
          {xp} XP · see levels
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-strong)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${levelInfo.progress}%` }}
          transition={{ duration: 0.55, ease }}
        />
      </div>
    </Card>
  );
}

function SmallWinsCard({ state, dashboardStats, currency }) {
  const recentWins = state.achievements.slice(0, 3);
  const hasWins = recentWins.length > 0 || state.totalUrgesSurfed > 0 || dashboardStats.releasedCount > 0;

  return (
    <Card delay={0.14} className="mt-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs" style={{ color: "var(--faint)" }}>small wins</p>
          <h2 data-hand-font="true" className="mt-1 text-[1.65rem] leading-none tracking-[-0.04em]">proof you did not give in</h2>
        </div>
        {state.noBuyStreak > 0 && (
          <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            day {state.noBuyStreak}
          </span>
        )}
      </div>

      {hasWins ? (
        <div className="mt-4 space-y-2">
          {dashboardStats.releasedCount > 0 && (
            <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--accent-soft)" }}>
              <p data-hand-font="true" className="text-[1.18rem] leading-none">{dashboardStats.releasedCount} impulse{dashboardStats.releasedCount === 1 ? "" : "s"} released</p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {formatMoney(dashboardStats.releasedTotal, currency)} stayed with you.
              </p>
            </div>
          )}

          {recentWins.map((achievement) => (
            <div key={achievement.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface-strong)" }}>
              <p data-hand-font="true" className="text-[1.12rem] leading-none">{achievement.title}</p>
              <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>{achievement.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
          Your first win can be tiny: pause one cart, log one no-buy day, or use what you already own.
        </p>
      )}
    </Card>
  );
}

function RealityCheck({ price, currency }) {
  const check = getRealityCheck(price, currency);
  if (!check) return null;

  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--accent-soft)" }}>
      <p className="text-sm">do you need this today?</p>
      <p className="mt-1 text-xs leading-5" style={{ color: "var(--muted)" }}>{check.headline}</p>
      <p className="mt-1 text-xs leading-5" style={{ color: "var(--muted)" }}>{check.line}</p>
    </div>
  );
}

function DupeCheck({ matches }) {
  if (!matches.length) return null;

  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface-strong)" }}>
      <p className="text-sm">you may already own this feeling</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {matches.map((product) => (
          <SoftMeta key={product.id}>{product.name}</SoftMeta>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5" style={{ color: "var(--muted)" }}>
        Try one before deciding. Deja Pan is not saying never. Just not on autopilot.
      </p>
    </div>
  );
}

function UrgeCard({ urgeSession, updateUrgeDraft, beginUrgeSurf, cancelUrgeSurf, currency, products }) {
  const draft = urgeSession.draft;
  const isActive = urgeSession.isActive;
  const matches = findShelfMatches(products, draft);

  return (
    <Card delay={0.15} className="mt-4">
      <SectionTitle
        eyebrow="pause"
        title={isActive ? "wait it out" : "about to buy?"}
        copy={isActive ? "Let the urge peak without checking out." : "Use this before checkout. Add the item, answer a few honest questions, then let it cool."}
      />

      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease }}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <p data-display-font="true" className="text-[4rem] font-normal leading-none tracking-[-0.1em]">{urgeSession.countdown}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>you are not deciding forever. just not buying on impulse.</p>
            </div>
            <GhostButton onClick={cancelUrgeSurf}>cancel</GhostButton>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease }}
            className="space-y-3"
          >
            <Field label="product">
              <TextInput
                value={draft.productName}
                onChange={(event) => updateUrgeDraft("productName", event.target.value)}
                placeholder="another brown lipstick"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="category">
                <SelectInput value={draft.category} onChange={(event) => updateUrgeDraft("category", event.target.value)}>
                  <CategorySelectOptions value={draft.category} />
                </SelectInput>
              </Field>
              <Field label={`price (${currency?.symbol || currency?.code || "¤"})`}>
                <TextInput
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(event) => updateUrgeDraft("price", event.target.value)}
                  placeholder="optional"
                />
              </Field>
            </div>

            <RealityCheck price={draft.price} currency={currency} />
            <DupeCheck matches={matches} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="replacing an empty?">
                <SelectInput value={draft.isReplacement} onChange={(event) => updateUrgeDraft("isReplacement", event.target.value)}>
                  {REPLACEMENT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </SelectInput>
              </Field>
              <Field label="own similar?">
                <SelectInput value={draft.ownsSimilar} onChange={(event) => updateUrgeDraft("ownsSimilar", event.target.value)}>
                  {SIMILAR_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </SelectInput>
              </Field>
            </div>

            <Field label="what made it urgent?">
              <SelectInput value={draft.trigger} onChange={(event) => updateUrgeDraft("trigger", event.target.value)}>
                {TRIGGERS.map((trigger) => <option key={trigger} value={trigger}>{trigger}</option>)}
              </SelectInput>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="cool-off">
                <SelectInput value={draft.delay} onChange={(event) => updateUrgeDraft("delay", event.target.value)}>
                  {DELAY_OPTIONS.map((delay) => <option key={delay} value={delay}>{delay}</option>)}
                </SelectInput>
              </Field>
              <Field label="similar thing you own">
                <TextInput
                  value={draft.ownedAlternative}
                  onChange={(event) => updateUrgeDraft("ownedAlternative", event.target.value)}
                  placeholder={matches[0]?.name || "optional"}
                />
              </Field>
            </div>

            <PrimaryButton onClick={beginUrgeSurf} className="w-full">pause before buying</PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function ProductMark({ product, large = false }) {
  const label = product.brand || product.name;

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-[1.15rem] border font-semibold tracking-[-0.04em]",
        large ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm"
      )}
      style={{
        borderColor: "var(--line)",
        background: "linear-gradient(145deg, var(--accent-soft), var(--surface-strong))",
        color: "var(--text)",
      }}
    >
      {initials(label)}
    </div>
  );
}

function SoftMeta({ children }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[0.72rem]"
      style={{ borderColor: "var(--line)", color: "var(--muted)", background: "var(--surface-strong)" }}
    >
      {children}
    </span>
  );
}

function NoBuyCard({ state, onCompleteNoBuy }) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const doneToday = state.lastNoBuyDate === todayString;

  return (
    <Card delay={0.2} className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs" style={{ color: "var(--faint)" }}>no-buy streak</p>
          <h2 className="mt-1 text-2xl tracking-[-0.05em]">
            {state.noBuyStreak || 0} day{state.noBuyStreak === 1 ? "" : "s"}
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {doneToday ? "today is counted. come back tomorrow." : "No impulse beauty buy today? Count the day."}
          </p>
          {state.bestNoBuyStreak > 0 && (
            <p className="mt-1 text-xs" style={{ color: "var(--faint)" }}>best: {state.bestNoBuyStreak} days</p>
          )}
        </div>
        <GhostButton onClick={onCompleteNoBuy} disabled={doneToday} active={doneToday} className="px-4 py-2">
          {doneToday ? "done" : "log today"}
        </GhostButton>
      </div>
    </Card>
  );
}

function HomeView(props) {
  const {
    state,
    xp,
    levelInfo,
    dashboardStats,
    currency,
    onGoShelf,
    activeProducts,
    urgeSession,
    updateUrgeDraft,
    beginUrgeSurf,
    cancelUrgeSurf,
    completeNoBuyDay,
    onOpenLevels,
  } = props;

  return (
    <section>
      <HomeHero
        state={state}
        dashboardStats={dashboardStats}
        currency={currency}
        onCompleteNoBuy={completeNoBuyDay}
        onGoShelf={onGoShelf}
      />
      <SmallWinsCard state={state} dashboardStats={dashboardStats} currency={currency} />
      <UrgeCard
        urgeSession={urgeSession}
        updateUrgeDraft={updateUrgeDraft}
        beginUrgeSurf={beginUrgeSurf}
        cancelUrgeSurf={cancelUrgeSurf}
        currency={currency}
        products={activeProducts}
      />
      <HomeProgressCard xp={xp} levelInfo={levelInfo} onOpenLevels={onOpenLevels} />
    </section>
  );
}

function ProductCard({ product, onLogUse, onAddPastUses, onMarkEmpty, onEdit, onDelete, currency }) {
  const isEmpty = product.status === "empty";
  const cpu = costPerUse(product);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease }}
      className={cn("rounded-[1.35rem] border", isEmpty && "opacity-70")}
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <ProductMark product={product} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {product.brand && (
                  <p className="mb-0.5 truncate text-[0.72rem] uppercase tracking-[0.12em]" style={{ color: "var(--faint)" }}>
                    {product.brand}
                  </p>
                )}
                <p className="truncate text-[1.05rem] tracking-[-0.03em]">{product.name}</p>
                <p data-hand-font="true" data-hand-soft="true" className="mt-1 truncate text-[1.02rem] leading-5" style={{ color: "var(--muted)" }}>
                  {product.shade || "no note"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className="rounded-full border px-2.5 py-1 text-[0.7rem]"
                  style={{ borderColor: "var(--line)", color: isEmpty ? "var(--gold)" : "var(--muted)" }}
                >
                  {isEmpty ? "empty" : displayCategory(product.category)}
                </span>
                <div className="flex gap-2 text-[0.72rem]">
                  <button type="button" onClick={() => onEdit(product)} style={{ color: "var(--muted)" }}>edit</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${product.name} from your shelf?`)) onDelete(product.id);
                    }}
                    style={{ color: "var(--faint)" }}
                  >
                    delete
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <SoftMeta>{product.uses} uses</SoftMeta>
              <SoftMeta>{formatRelativeDate(isEmpty ? product.emptiedAt : product.lastUsedAt)}</SoftMeta>
              {cpu && <SoftMeta>{formatMoney(cpu, currency)}/use</SoftMeta>}
            </div>
          </div>
        </div>
      </div>

      {!isEmpty && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t p-2.5" style={{ borderColor: "var(--line)" }}>
          <PrimaryButton onClick={() => onLogUse(product.id)} className="py-2.5">log use</PrimaryButton>
          <GhostButton onClick={() => onAddPastUses(product)} className="px-4 py-2.5">past uses</GhostButton>
          <GhostButton onClick={() => onMarkEmpty(product.id)} className="px-4 py-2.5">mark empty</GhostButton>
        </div>
      )}
    </motion.article>
  );
}

function ShelfSummary({ activeProducts, empties, products }) {
  const totalUses = products.reduce((sum, product) => sum + Number(product.uses || 0), 0);

  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {[
        ["active", activeProducts.length],
        ["uses", totalUses],
        ["empties", empties.length],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
          <p className="mt-1 text-2xl tracking-[-0.07em]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ShelfValueCard({ dashboardStats, currency }) {
  const hasPrices = dashboardStats.pricedProductCount > 0;

  return (
    <Card delay={0.08} className="mb-4 p-4" style={{ background: "var(--surface-strong)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--faint)" }}>shelf value</p>
          <h2 data-hand-font="true" className="mt-2 text-[2.8rem] font-normal leading-none tracking-[-0.08em]">
            {hasPrices ? formatMoney(dashboardStats.totalShelfValue, currency) : "not priced yet"}
          </h2>
        </div>
        {hasPrices && (
          <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            {dashboardStats.pricedProductCount}/{dashboardStats.productCount} priced
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
        {hasPrices
          ? "This is already sitting in your drawer. Check this before adding another similar thing."
          : "Add prices to the products you care about. The number is meant to be a reality check, not an audit."}
      </p>

      {hasPrices && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat label="active value" value={formatMoney(dashboardStats.activeShelfValue, currency)} />
          <MiniStat label="emptied value" value={formatMoney(dashboardStats.emptyShelfValue, currency)} />
        </div>
      )}
    </Card>
  );
}


function ProductList({ products, onLogUse, onAddPastUses, onMarkEmpty, onEditProduct, onDeleteProduct, currency }) {
  if (products.length < 4) {
    return (
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onLogUse={onLogUse}
              onAddPastUses={onAddPastUses}
              onMarkEmpty={onMarkEmpty}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              currency={currency}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupShelfProducts(products).map((group) => (
        <div key={group.section} className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--faint)" }}>
              {group.section}
            </p>
            <p className="text-xs" style={{ color: "var(--faint)" }}>
              {group.products.length}
            </p>
          </div>
          <AnimatePresence initial={false}>
            {group.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onLogUse={onLogUse}
                onAddPastUses={onAddPastUses}
                onMarkEmpty={onMarkEmpty}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                currency={currency}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function ShelfView({ products, activeProducts, empties, dashboardStats, onAddProduct, onLogUse, onAddPastUses, onMarkEmpty, onEditProduct, onDeleteProduct, currency }) {

  return (
    <section>
      <SectionTitle
        eyebrow="shelf"
        title="things you own"
        copy="This is not a perfect inventory. It is a small shelf you actually return to."
        action={<PrimaryButton onClick={onAddProduct} className="px-4 py-2.5">add</PrimaryButton>}
      />

      {products.length === 0 ? (
        <Card style={{ background: "var(--surface-strong)" }}>
          <p className="text-xl tracking-[-0.04em]">add one product first</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Pick the one you keep forgetting to use. Lipstick, skin tint, sunscreen, perfume, anything.
          </p>
          <PrimaryButton onClick={onAddProduct} className="mt-5 w-full">add product</PrimaryButton>
        </Card>
      ) : (
        <>
          <ShelfValueCard dashboardStats={dashboardStats} currency={currency} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--muted)" }}>active shelf</p>
              <p className="text-xs" style={{ color: "var(--faint)" }}>log use only here</p>
            </div>

            {activeProducts.length === 0 ? (
              <Card style={{ background: "var(--surface-strong)" }}>
                <p className="text-lg tracking-[-0.04em]">no active products right now</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Add something you want to return to this week.
                </p>
                <PrimaryButton onClick={onAddProduct} className="mt-4 w-full">add product</PrimaryButton>
              </Card>
            ) : (
              <ProductList
                products={activeProducts}
                onLogUse={onLogUse}
                onAddPastUses={onAddPastUses}
                onMarkEmpty={onMarkEmpty}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                currency={currency}
              />
            )}
          </div>

          <div className="mt-5">
            <ShelfSummary activeProducts={activeProducts} empties={empties} products={products} />
          </div>

          {empties.length > 0 && (
            <div className="pt-2">
              <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>empties drawer</p>
              <ProductList
                products={empties}
                onLogUse={onLogUse}
                onAddPastUses={onAddPastUses}
                onMarkEmpty={onMarkEmpty}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                currency={currency}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function VaultItem({ item, onDecide, currency }) {
  const statusCopy = item.status === "cooling" ? "cooling" : item.status === "released" ? "released" : "intentional";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg tracking-[-0.03em]">{item.productName}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{displayCategory(item.category)} · {formatMoney(item.price, currency)}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: item.status === "released" ? "var(--gold)" : "var(--muted)" }}>
          {statusCopy}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
        <p style={{ color: "var(--muted)" }}>why: {item.trigger}</p>
        <p className="mt-1" style={{ color: "var(--muted)" }}>cool-off: {item.delay}</p>
        <p className="mt-1" style={{ color: "var(--muted)" }}>replacement: {item.isReplacement} · similar: {item.ownsSimilar}</p>
        <p className="mt-1 truncate" style={{ color: "var(--muted)" }}>owned: {item.ownedAlternative}</p>
      </div>

      {item.status === "cooling" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PrimaryButton onClick={() => onDecide(item.id, "released")} className="px-3">release</PrimaryButton>
          <GhostButton onClick={() => onDecide(item.id, "cooling")} className="px-3">wait</GhostButton>
          <GhostButton onClick={() => onDecide(item.id, "intentional")} className="px-3">buy</GhostButton>
        </div>
      )}
    </Card>
  );
}

function VaultView({ vault, onDecide, currency }) {
  return (
    <section>
      <SectionTitle eyebrow="paused cart" title="almost bought" copy="Products you paused instead of buying immediately." />
      {vault.length === 0 ? (
        <Card>
          <p className="text-lg">nothing paused yet</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Use the pause form on home when a product starts feeling urgent.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {vault.map((item) => <VaultItem key={item.id} item={item} onDecide={onDecide} currency={currency} />)}
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--line)" }}>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="mt-1 text-xl tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function EditView({ state, dashboardStats, triggerInsights, currency, currencies, setCurrency }) {
  return (
    <section>
      <SectionTitle eyebrow="report" title="what changed" copy="A simple summary of what you used, paused, and finished." />

      <Card>
        <p className="text-sm" style={{ color: "var(--muted)" }}>money kept</p>
        <h2 className="mt-2 text-[3rem] font-normal tracking-[-0.09em]">{formatMoney(state.totalMoneySaved, currency)}</h2>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStat label="urges" value={state.totalUrgesSurfed} />
          <MiniStat label="released" value={dashboardStats.releasedCount} />
          <MiniStat label="empties" value={dashboardStats.emptyCount} />
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle
          eyebrow="shelf value"
          title={dashboardStats.pricedProductCount ? formatMoney(dashboardStats.totalShelfValue, currency) : "not priced yet"}
          copy={dashboardStats.pricedProductCount ? "Known value of products you added to your shelf. Use it as a pause before buying more." : "Add prices to shelf products to see the total value sitting in your drawer."}
        />
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="active" value={formatMoney(dashboardStats.activeShelfValue, currency)} />
          <MiniStat label="priced items" value={`${dashboardStats.pricedProductCount}/${dashboardStats.productCount}`} />
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle eyebrow="patterns" title="common triggers" />
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="top trigger" value={triggerInsights.topTrigger} />
          <MiniStat label="category" value={displayCategory(triggerInsights.topCategory)} />
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle eyebrow="currency" title="money display" copy="Pick your currency once. Product prices and savings use it everywhere." />
        <CurrencyPicker currency={currency} currencies={currencies} onSetCurrency={setCurrency} compact />
      </Card>
    </section>
  );
}

function ProductFormModal({ open, mode = "add", product, onClose, onAddProduct, onUpdateProduct, currency, currencies, setCurrency }) {
  const [draft, setDraft] = useState(EMPTY_PRODUCT_DRAFT);
  const isEdit = mode === "edit" && Boolean(product);

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setDraft({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "lipstick",
        shade: product.shade === "not set" ? "" : product.shade || "",
        price: product.price ? String(product.price) : "",
        uses: Number(product.uses || 0) ? String(product.uses) : "",
      });
      return;
    }

    setDraft(EMPTY_PRODUCT_DRAFT);
  }, [open, isEdit, product]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    if (!draft.name.trim()) return;

    if (isEdit) {
      onUpdateProduct(product.id, draft);
    } else {
      onAddProduct(draft);
    }

    setDraft(EMPTY_PRODUCT_DRAFT);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.34)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
        >
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 26 }}
            transition={{ duration: 0.32, ease }}
            className="w-full max-w-[460px] rounded-[1.5rem] border p-5 shadow-2xl"
            style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--text)" }}
          >
            <SectionTitle
              eyebrow="shelf"
              title={isEdit ? "edit product" : "add product"}
              copy={isEdit ? "Fix the brand, name, category, note, or price." : "Add only what you want to notice, not every product you own."}
              action={<GhostButton onClick={onClose}>close</GhostButton>}
            />
            <div className="space-y-3">
              <Field label="brand name (optional)">
                <TextInput value={draft.brand} onChange={(event) => update("brand", event.target.value)} placeholder="rare beauty, mac, etude..." />
              </Field>
              <Field label="product name">
                <TextInput value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="soft pinch blush, alone time, skin tint..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="category">
                  <SelectInput value={draft.category} onChange={(event) => update("category", event.target.value)}>
                    <CategorySelectOptions value={draft.category} />
                  </SelectInput>
                </Field>
                <Field label={`price (${currency?.symbol || currency?.code || "¤"})`}>
                  <TextInput type="number" min="0" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="optional" />
                </Field>
              </div>
              <Field label="shade / note">
                <TextInput value={draft.shade} onChange={(event) => update("shade", event.target.value)} placeholder="shade, texture, why you want to use it" />
              </Field>
              <Field label={isEdit ? "current uses" : "past uses so far (optional)"}>
                <TextInput
                  type="number"
                  min="0"
                  step="1"
                  value={draft.uses}
                  onChange={(event) => update("uses", event.target.value)}
                  placeholder="0"
                />
              </Field>
              <CurrencyPicker currency={currency} currencies={currencies} onSetCurrency={setCurrency} compact />
              <PrimaryButton onClick={submit} className="w-full">{isEdit ? "save changes" : "add to shelf"}</PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PastUsesModal({ product, onClose, onAddPastUses }) {
  const [amount, setAmount] = useState("");
  const open = Boolean(product);

  useEffect(() => {
    if (open) setAmount("");
  }, [open, product?.id]);

  function submit() {
    const value = Math.max(0, Math.floor(Number(amount || 0)));
    if (!product || value <= 0) return;

    onAddPastUses(product.id, value);
    onClose();
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      eyebrow="shelf"
      title="add past uses"
      copy={product ? `Use this when ${product.name} was already partly used before adding it here. It updates the count and cost-per-use, but does not give XP.` : ""}
    >
      <div className="space-y-3">
        <Field label="how many previous uses?">
          <TextInput
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 12"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <GhostButton onClick={onClose} className="w-full py-3">cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={!Number(amount)} className="w-full py-3">add uses</PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

function Toast({ toast, onDismiss }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.button
          type="button"
          onClick={onDismiss}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.32, ease }}
          className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 rounded-[1.25rem] border p-4 text-left shadow-xl backdrop-blur-2xl"
          style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--text)" }}
        >
          <p className="text-sm">{toast.title}</p>
          <p className="mt-1 text-sm leading-5" style={{ color: "var(--muted)" }}>{toast.description}</p>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "home", label: "home" },
    { id: "shelf", label: "shelf" },
    { id: "vault", label: "cart" },
    { id: "edit", label: "report" },
  ];

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 rounded-full border p-1.5 shadow-lg backdrop-blur-2xl"
      style={{ borderColor: "var(--line)", background: "var(--surface-strong)" }}
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className="rounded-full px-3 py-3 text-xs transition"
            style={{
              background: view === item.id ? "var(--accent-soft)" : "transparent",
              color: view === item.id ? "var(--text)" : "var(--muted)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f0e6] text-[#221b16]">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease }} className="text-sm">
        déjà pan
      </motion.p>
    </main>
  );
}

export default function Dashboard() {
  const [view, setView] = useState("home");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pastUseProduct, setPastUseProduct] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const app = useAppState();

  const shouldShowGuide = useMemo(
    () => guideOpen || (!app.state.guideDismissed && app.dashboardStats.productCount === 0),
    [app.dashboardStats.productCount, app.state.guideDismissed, guideOpen]
  );

  if (!app.hydrated) return <LoadingState />;

  function closeGuide() {
    setGuideOpen(false);
    app.dismissGuide();
  }

  function openShelf() {
    setView("shelf");
    setGuideOpen(false);
  }

  function openAddProductFromGuide() {
    closeGuide();
    setShowAddProduct(true);
  }

  function openShelfFromGuide() {
    closeGuide();
    setView("shelf");
  }

  return (
    <Shell theme={app.theme} font={app.font}>
      <AppHeader
        onReset={() => setShowResetConfirm(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenTheme={() => setShowThemePicker(true)}
        onOpenLevels={() => setShowLevels(true)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease }}
        >
          {view === "home" && (
            <HomeView
              state={app.state}
              xp={app.xp}
              levelInfo={app.levelInfo}
              dashboardStats={app.dashboardStats}
              currency={app.currency}
              activeProducts={app.activeProducts}
              onGoShelf={openShelf}
              urgeSession={app.urgeSession}
              updateUrgeDraft={app.updateUrgeDraft}
              beginUrgeSurf={app.beginUrgeSurf}
              cancelUrgeSurf={app.cancelUrgeSurf}
              completeNoBuyDay={app.completeNoBuyDay}
              onOpenLevels={() => setShowLevels(true)}
            />
          )}

          {view === "shelf" && (
            <ShelfView
              products={app.state.products}
              activeProducts={app.activeProducts}
              empties={app.empties}
              dashboardStats={app.dashboardStats}
              onAddProduct={() => setShowAddProduct(true)}
              onLogUse={app.logProductUse}
              onAddPastUses={setPastUseProduct}
              onMarkEmpty={app.markProductEmpty}
              onEditProduct={setEditingProduct}
              onDeleteProduct={app.deleteProduct}
              currency={app.currency}
            />
          )}

          {view === "vault" && <VaultView vault={app.state.vault} onDecide={app.decideVaultItem} currency={app.currency} />}

          {view === "edit" && (
            <EditView
              state={app.state}
              dashboardStats={app.dashboardStats}
              triggerInsights={app.triggerInsights}
              currency={app.currency}
              currencies={app.currencies}
              setCurrency={app.setCurrency}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <GuideModal
        open={shouldShowGuide}
        state={app.state}
        dashboardStats={app.dashboardStats}
        onAddProduct={openAddProductFromGuide}
        onClose={closeGuide}
        onGoShelf={openShelfFromGuide}
      />
      <ThemeModal
        open={showThemePicker}
        themes={app.themes}
        themeId={app.state.themeId}
        onSetTheme={app.setTheme}
        fonts={app.fonts}
        fontId={app.state.fontId}
        onSetFont={app.setFont}
        onClose={() => setShowThemePicker(false)}
      />
      <LevelsModal
        open={showLevels}
        levels={app.levels}
        levelInfo={app.levelInfo}
        xp={app.xp}
        xpRewards={app.xpRewards}
        onClose={() => setShowLevels(false)}
      />
      <ResetConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={app.resetAll}
      />
      <ProductFormModal
        open={showAddProduct || Boolean(editingProduct)}
        mode={editingProduct ? "edit" : "add"}
        product={editingProduct}
        onClose={() => {
          setShowAddProduct(false);
          setEditingProduct(null);
        }}
        onAddProduct={app.addProduct}
        onUpdateProduct={app.updateProduct}
        currency={app.currency}
        currencies={app.currencies}
        setCurrency={app.setCurrency}
      />
      <PastUsesModal
        product={pastUseProduct}
        onClose={() => setPastUseProduct(null)}
        onAddPastUses={app.addPastProductUses}
      />
      <Toast toast={app.toast} onDismiss={app.dismissToast} />
      <BottomNav view={view} setView={setView} />
    </Shell>
  );
}
