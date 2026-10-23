import { z } from "zod";
import { CONTENT_TYPES, PLATFORMS } from "@/shared/db/schema";

/**
 * What an agent sends to propose an idea: the plan's own fields plus "why".
 * Messages are English: agents read them, not the team.
 */
export const proposalInputSchema = z.strictObject({
  goal: z.string().trim().min(1).max(1000),
  idea: z.string().trim().min(1).max(2000),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(PLATFORMS.length),
  type: z.enum(CONTENT_TYPES),
  publishDate: z.iso.date().nullish(),
  goldenTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, 24-hour.")
    .nullish(),
  assetLinks: z
    .array(z.url({ protocol: /^https?$/ }))
    .max(20)
    .default([]),
  why: z.string().trim().min(1).max(2000),
});

export type ProposalInput = z.output<typeof proposalInputSchema>;

/** Where a proposal stands, as an agent sees it. */
export type ProposalState = "pending" | "approved" | "rejected";

export function proposalState(row: {
  status: string;
  rejectedAt: Date | null;
}): ProposalState {
  if (row.rejectedAt) return "rejected";
  return row.status === "proposed" ? "pending" : "approved";
}
