"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import {
  contentTypeLabels,
  platformLabels,
  statusLabels,
} from "@/entities/content";
import { CONTENT_STATUSES, CONTENT_TYPES, PLATFORMS } from "@/shared/db/schema";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import type { Member } from "../api/queries";
import { type SaveContentState, saveContent } from "../api/save-content";
import type { ContentFormValues } from "../model/content-form";

type Props = {
  id: string | null;
  initial: ContentFormValues;
  members: Member[];
};

export function ContentForm({ id, initial: values, members }: Props) {
  const [state, action, pending] = useActionState<SaveContentState, FormData>(
    saveContent.bind(null, id),
    {},
  );

  return (
    <form
      // Submit by hand so React doesn't reset the form: a failed save keeps what was typed.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <Field label="Goal" htmlFor="goal" hint="What we want and why.">
        <Textarea
          id="goal"
          name="goal"
          rows={2}
          defaultValue={values.goal}
          required
        />
      </Field>

      <Field label="Content idea" htmlFor="idea">
        <Textarea
          id="idea"
          name="idea"
          rows={4}
          defaultValue={values.idea}
          required
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium text-sm">Platforms</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {PLATFORMS.map((platform) => (
            <label key={platform} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="platforms"
                value={platform}
                defaultChecked={values.platforms.includes(platform)}
                className="size-4 accent-primary"
              />
              {platformLabels[platform]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Content type" htmlFor="type">
          <NativeSelect
            id="type"
            name="type"
            defaultValue={values.type}
            className="w-full"
            required
          >
            <NativeSelectOption value="" disabled>
              Pick a type
            </NativeSelectOption>
            {CONTENT_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {contentTypeLabels[type]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Status" htmlFor="status">
          <NativeSelect
            id="status"
            name="status"
            defaultValue={values.status}
            className="w-full"
          >
            {CONTENT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {statusLabels[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Publish day" htmlFor="publishDate">
          <Input
            id="publishDate"
            name="publishDate"
            type="date"
            defaultValue={values.publishDate}
          />
        </Field>

        <Field label="Golden time" htmlFor="goldenTime">
          <Input
            id="goldenTime"
            name="goldenTime"
            type="time"
            defaultValue={values.goldenTime}
          />
        </Field>

        <Field label="Assignee" htmlFor="assigneeId">
          <NativeSelect
            id="assigneeId"
            name="assigneeId"
            defaultValue={values.assigneeId}
            className="w-full"
          >
            <NativeSelectOption value="">Unassigned</NativeSelectOption>
            {members.map((member) => (
              <NativeSelectOption key={member.id} value={member.id}>
                {member.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Asset links" htmlFor="assetLinks" hint="One URL per line.">
        <Textarea
          id="assetLinks"
          name="assetLinks"
          rows={3}
          defaultValue={values.assetLinks}
          placeholder="https://drive.google.com/…"
        />
      </Field>

      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Add to plan"}
        </Button>
        <Link href="/content" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
