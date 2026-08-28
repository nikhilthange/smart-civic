/**
 * ─── Dynamic Localization & Currency Formatters ──────────────────────────────
 * Provides standardized Intl-based date, time, and Indian currency formatters.
 */

export function getLocaleCode(lang?: string): string {
  if (!lang) return "en-IN"
  if (lang.startsWith("mr")) return "mr-IN"
  if (lang.startsWith("hi")) return "hi-IN"
  return "en-IN"
}

export function formatDate(date: string | number | Date, lang?: string): string {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat(getLocaleCode(lang), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d)
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | number | Date, lang?: string): string {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat(getLocaleCode(lang), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return String(date)
  }
}

export function formatCurrencyINR(amount: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(getLocaleCode(lang), {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

export function formatNumber(num: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(getLocaleCode(lang)).format(num)
  } catch {
    return String(num)
  }
}
