"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import { CONTENT_STATUSES, CONTENT_TYPES, PLATFORMS } from "@/shared/db/schema";
import { Link } from "@/shared/i18n";
import { cn } from "@/shared/lib";
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
  /** Extra cards under the status card, such as the admin-only delete. */
  aside?: React.ReactNode;
};

export function ContentForm({ id, initial: values, members, aside }: Props) {
  const [state, action, pending] = useActionState<SaveContentState, FormData>(
    saveContent.bind(null, id),
    {},
  );
  const t = useTranslations();

  return (
    <form
      // Submit by hand so React doesn't reset the form: a failed save keeps what was typed.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      // One column on narrow screens, in the order people fill it: brief, format, schedule,
      // links, status and owner, then save. From xl, status and owner move to a side column.
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"
    >
      <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-span-2 xl:row-start-1">
        <Section title={t("contentEditor.brief")}>
          <Field
            label={t("contentEditor.goal")}
            htmlFor="goal"
            hint={t("contentEditor.goalHint")}
          >
            <Textarea
              id="goal"
              name="goal"
              rows={2}
              defaultValue={values.goal}
              required
            />
          </Field>
          <Field label={t("contentEditor.idea")} htmlFor="idea">
            <Textarea
              id="idea"
              name="idea"
              rows={4}
              defaultValue={values.idea}
              required
            />
          </Field>
        </Section>

        <div className="flex flex-wrap gap-6">
          <Section
            title={t("contentEditor.format")}
            className="flex-[3_1_20rem]"
          >
            <fieldset className="flex flex-col">
              <legend className="mb-2.5 pl-1 text-[13px] font-medium">
                {t("contentEditor.platforms")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="group flex h-10 cursor-pointer items-center gap-2 rounded-full bg-muted pr-4 pl-2.5 text-[13px] font-medium transition-colors hover:bg-muted-strong has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                  >
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      defaultChecked={values.platforms.includes(platform)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full bg-card text-transparent ring-[1.5px] ring-muted-foreground ring-inset peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-0"
                    >
                      <CheckIcon className="size-3" strokeWidth={4} />
                    </span>
                    {t(`content.platform.${platform}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label={t("contentEditor.contentType")} htmlFor="type">
              <NativeSelect
                id="type"
                name="type"
                defaultValue={values.type}
                className="w-full"
                required
              >
                <NativeSelectOption value="" disabled>
                  {t("contentEditor.pickType")}
                </NativeSelectOption>
                {CONTENT_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {t(`content.type.${type}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </Section>

          <Section
            title={t("contentEditor.schedule")}
            className="flex-[2_1_16rem]"
          >
            <Field label={t("contentEditor.publishDay")} htmlFor="publishDate">
              <Input
                id="publishDate"
                name="publishDate"
                type="date"
                defaultValue={values.publishDate}
                className="tabular-nums"
              />
            </Field>
            <Field
              label={t("contentEditor.goldenTime")}
              htmlFor="goldenTime"
              hint={t("contentEditor.goldenTimeHint")}
            >
              <Input
                id="goldenTime"
                name="goldenTime"
                type="time"
                defaultValue={values.goldenTime}
                className="tabular-nums"
              />
            </Field>
          </Section>
        </div>

        <Section title={t("contentEditor.assetLinks")}>
          <Field
            label={t("contentEditor.links")}
            htmlFor="assetLinks"
            hint={t("contentEditor.linksHint")}
          >
            <Textarea
              id="assetLinks"
              name="assetLinks"
              rows={3}
              defaultValue={values.assetLinks}
              placeholder="https://drive.google.com/…"
            />
          </Field>
        </Section>
      </div>

      <div className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-start-1">
        <Section title={t("contentEditor.statusAndOwner")}>
          <Field label={t("contentEditor.status")} htmlFor="status">
            <NativeSelect
              id="status"
              name="status"
              defaultValue={values.status}
              className="w-full"
            >
              {CONTENT_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {t(`content.status.${status}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("contentEditor.assignee")} htmlFor="assigneeId">
            <NativeSelect
              id="assigneeId"
              name="assigneeId"
              defaultValue={values.assigneeId}
              className="w-full"
            >
              <NativeSelectOption value="">
                {t("common.unassigned")}
              </NativeSelectOption>
              {members.map((member) => (
                <NativeSelectOption key={member.id} value={member.id}>
                  {member.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </Section>
      </div>

      <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-start-3">
        {state.error ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive-soft px-5 py-3.5 text-foreground"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Link
            href="/content"
            className={buttonVariants({ variant: "ghost" })}
          >
            {t("common.cancel")}
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? t("common.saving")
              : id
                ? t("contentEditor.saveChanges")
                : t("contentEditor.addToPlan")}
          </Button>
        </div>
      </div>

      {aside ? (
        <div className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-start-2">
          {aside}
        </div>
      ) : null}
    </form>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
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
      {hint ? (
        <p className="pl-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
