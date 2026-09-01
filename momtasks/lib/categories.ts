// Task categories, shared between the post form and browse filters.
export const CATEGORIES = [
  { value: "childcare", label: "Childcare & babysitting", emoji: "👶" },
  { value: "pickup", label: "School / activity pickup", emoji: "🚗" },
  { value: "meals", label: "Meals & baking", emoji: "🍲" },
  { value: "errands", label: "Errands & shopping", emoji: "🛒" },
  { value: "cleaning", label: "Cleaning & tidying", emoji: "🧹" },
  { value: "petcare", label: "Pet care", emoji: "🐾" },
  { value: "tutoring", label: "Tutoring & homework help", emoji: "📚" },
  { value: "events", label: "Party & event help", emoji: "🎉" },
  { value: "other", label: "Other", emoji: "✨" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

const byValue = new Map(CATEGORIES.map((c) => [c.value, c]));

export function categoryLabel(value: string): string {
  return byValue.get(value as CategoryValue)?.label ?? "Other";
}

export function categoryEmoji(value: string): string {
  return byValue.get(value as CategoryValue)?.emoji ?? "✨";
}

export function isValidCategory(value: string): boolean {
  return byValue.has(value as CategoryValue);
}

// Money helpers — we store cents, display dollars.
export function formatPay(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
