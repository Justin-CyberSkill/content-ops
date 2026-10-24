import { expect, test } from "vitest";
import { createChangesSchema, readChangesForm } from "./verdict";

const schema = createChangesSchema((key) => key);
const prep = "8f6c1c1e-0000-4000-8000-0000000000a1";

test("reads the note and every task picked to send back", () => {
  const form = new FormData();
  form.set("note", " Shorter hook ");
  form.append("reopen", prep);
  expect(schema.parse(readChangesForm(form))).toEqual({
    note: "Shorter hook",
    reopen: [prep],
  });
});

test("needs a note and at least one task", () => {
  const result = schema.safeParse(readChangesForm(new FormData()));
  expect(result.error?.issues.map((issue) => issue.message)).toEqual([
    "changesNoteRequired",
    "pickTasksToReopen",
  ]);
});
