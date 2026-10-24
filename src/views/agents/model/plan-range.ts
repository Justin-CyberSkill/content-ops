import { z } from "zod";

const DAY_MS = 86_400_000;
const MAX_PLAN_DAYS = 92;

const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DAY_MS;
const addDays = (iso: string, days: number) =>
  new Date((toDay(iso) + days) * DAY_MS).toISOString().slice(0, 10);

/** `from`/`to` days for reading the plan. Defaults to today and the next 30 days in the team's zone. */
export function planRangeSchema(now: Date, timeZone: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  return z
    .object({
      from: z.iso.date().default(today),
      to: z.iso.date().optional(),
    })
    .transform(({ from, to }) => ({ from, to: to ?? addDays(from, 30) }))
    .refine(({ from, to }) => toDay(to) >= toDay(from), {
      message: "`to` must be on or after `from`.",
      path: ["to"],
    })
    .refine(({ from, to }) => toDay(to) - toDay(from) <= MAX_PLAN_DAYS, {
      message: `Ask for at most ${MAX_PLAN_DAYS} days at a time.`,
      path: ["to"],
    });
}
