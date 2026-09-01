/**
 * Tailwind class recipes for shared primitives.
 *
 * Keep complete class names as string literals so Tailwind's source scanner can generate every
 * required utility. Feature components should compose these recipes instead of recreating button
 * geometry or state colors locally.
 */
export const buttonStyles = {
  base: "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-app-md border border-transparent text-[0.9rem] font-[650] leading-none transition-[background,border-color,box-shadow,color,transform] duration-[120ms] disabled:border-app-neutral-200 disabled:bg-app-neutral-100 disabled:text-app-neutral-400 disabled:shadow-none",
  size: {
    compact: "min-h-[34px] px-[0.7rem] py-[0.45rem] text-[0.82rem]",
    default: "min-h-[42px] px-4 py-[0.68rem]",
    large: "min-h-12 px-[1.15rem] py-[0.82rem]",
  },
  variant: {
    primary: "border-brand bg-brand text-white shadow-[0_1px_2px_rgb(12_42_62_/_0.16)] enabled:hover:border-brand-hover enabled:hover:bg-brand-hover enabled:active:translate-y-px enabled:active:bg-brand-active",
    secondary: "border-app-neutral-300 bg-surface-elevated text-app-neutral-800 shadow-[0_1px_1px_rgb(15_23_42_/_0.03)] enabled:hover:border-app-neutral-400 enabled:hover:bg-app-neutral-50",
    tertiary: "bg-transparent text-kc-700 enabled:hover:bg-kc-50 enabled:hover:text-kc-900",
    danger: "bg-app-danger text-white",
  },
} as const;

export const iconButtonStyles =
  "relative inline-flex size-10 flex-[0_0_40px] items-center justify-center rounded-app-md border-0 bg-transparent text-app-neutral-600 transition-[background,color] duration-[120ms] hover:bg-app-neutral-100 hover:text-app-neutral-900";
