import { z } from "zod";
import { CONTENT_TYPES, PLATFORMS } from "@/shared/db/schema";

// Messages are English: agents read them, not the team.
const fields = {
  goal: z.string().trim().min(1).max(1000),
  idea: z.string().trim().min(1).max(2000),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(PLATFORMS.length),
  type: z.enum(CONTENT_TYPES),
  publishDate: z.iso.date().nullish(),
  goldenTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, 24-hour.")
    .nullish(),
  assetLinks: z.array(z.url({ protocol: /^https?$/ })).max(20),
  why: z.string().trim().min(1).max(2000),
  sources: z.array(z.string().trim().min(1).max(300)).max(10),
};

/** What an agent sends to propose an idea: the plan's own fields, plus "why" and what it's based on. */
export const proposalInputSchema = z.strictObject({
  ...fields,
  assetLinks: fields.assetLinks.default([]),
  sources: fields.sources.default([]),
});

export type ProposalInput = z.output<typeof proposalInputSchema>;

/** A change to a pending idea: any of the same fields. Null clears the day or time. */
export const proposalUpdateFields = z.strictObject({
  goal: fields.goal.optional(),
  idea: fields.idea.optional(),
  platforms: fields.platforms.optional(),
  type: fields.type.optional(),
  publishDate: fields.publishDate,
  goldenTime: fields.goldenTime,
  assetLinks: fields.assetLinks.optional(),
  why: fields.why.optional(),
  sources: fields.sources.optional(),
});

export const proposalUpdateSchema = proposalUpdateFields.refine(
  (update) => Object.keys(update).length > 0,
  {
    message: "Send at least one field to change.",
    // Only when nothing else is wrong, so an unknown field isn't reported as "no fields".
    when: (payload) => !payload.issues.length,
  },
);

export type ProposalUpdate = z.output<typeof proposalUpdateSchema>;

export const withdrawInputSchema = z.strictObject({
  reason: z.string().trim().min(1).max(1000).optional(),
});

export const PROPOSAL_STATES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
] as const;

/** Where a proposal stands, as an agent sees it. */
export type ProposalState = (typeof PROPOSAL_STATES)[number];

export function proposalState(row: {
  status: string;
  rejectedAt: Date | null;
  withdrawnAt: Date | null;
}): ProposalState {
  if (row.rejectedAt) return "rejected";
  if (row.withdrawnAt) return "withdrawn";
  return row.status === "proposed" ? "pending" : "approved";
}

export const MAX_IDEAS = 100;

/** Filters for listing ideas: by state, by a source the idea is based on, and only this key's. */
export const ideaFilterSchema = z.strictObject({
  state: z.enum(PROPOSAL_STATES).optional(),
  source: z.string().trim().min(1).max(300).optional(),
  mine: z.boolean().optional(),
  limit: z.number().int().min(1).max(MAX_IDEAS).default(50),
});

export type IdeaFilter = z.output<typeof ideaFilterSchema>;
