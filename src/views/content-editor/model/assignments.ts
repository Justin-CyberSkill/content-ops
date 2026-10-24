import { z } from "zod";

/** Form fields that pick who takes a step are named `assignee:<step id>`. */
export const ASSIGNEE_FIELD = "assignee:";

/** Who takes each step, by step id; "" leaves it unassigned. */
export type AssignmentValues = Record<string, string>;

const schema = z.record(z.uuid(), z.string().max(64));

/** Assignments from the client, as a map the task API takes. Anything malformed is dropped. */
export function parseAssignments(values: unknown): Map<string, string | null> {
  const parsed = schema.safeParse(values);
  if (!parsed.success) return new Map();
  return new Map(
    Object.entries(parsed.data).map(([stepId, assigneeId]) => [
      stepId,
      assigneeId || null,
    ]),
  );
}

export function readAssignments(formData: FormData): AssignmentValues {
  return Object.fromEntries(
    [...formData.entries()].flatMap(([key, value]) =>
      key.startsWith(ASSIGNEE_FIELD)
        ? [[key.slice(ASSIGNEE_FIELD.length), String(value)]]
        : [],
    ),
  );
}
