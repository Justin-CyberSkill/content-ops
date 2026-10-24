"use client";

import { ExternalLinkIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState, useTransition } from "react";
import type { Platform } from "@/shared/db/schema";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import {
  type AssetActionState,
  addAsset,
  addAssetVersion,
  deleteAsset,
} from "../api/assets";
import { ASSET_LABEL_MAX_LENGTH, ASSET_NOTE_MAX_LENGTH } from "../model/asset";
import { SinceReviewBadge } from "./since-review-badge";

type AssetVersionView = {
  id: string;
  url: string;
  note: string;
  byName: string | null;
  /** ISO time, for the <time> element. */
  createdAt: string;
  /** Already formatted in the team's time zone. */
  time: string;
};

export type AssetView = {
  id: string;
  label: string;
  /** Null when it's for every platform. */
  platform: Platform | null;
  /** Oldest first; the last is the one to use. */
  versions: AssetVersionView[];
  /** A version was added after the last review. */
  changed: boolean;
  canDelete: boolean;
};

const hostOf = (url: string) => (URL.canParse(url) ? new URL(url).host : url);

/**
 * The files made for an idea, as links: each asset says what it is and which platform
 * it's for, opens its newest version, and keeps the older ones. Anyone can add an asset
 * or a version; whoever added an asset, or an admin, can delete it.
 */
export function AssetsCard({
  contentId,
  platforms,
  assets,
}: {
  contentId: string;
  /** The platforms the idea is for, to pick from. */
  platforms: Platform[];
  assets: AssetView[];
}) {
  const t = useTranslations("contentEditor.assets");
  const [adding, setAdding] = useState(false);
  return (
    <section
      aria-labelledby="assets-heading"
      className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="assets-heading"
          className="flex items-baseline gap-2 text-lg font-semibold"
        >
          {t("title")}
          {assets.length ? (
            <span className="font-sans text-[13px] font-normal text-muted-foreground tabular-nums">
              {t("count", { count: assets.length })}
            </span>
          ) : null}
        </h2>
        {adding ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
          >
            <PlusIcon aria-hidden="true" />
            {t("add")}
          </Button>
        )}
      </div>

      {assets.length ? (
        <ul className="flex flex-col">
          {assets.map((item) => (
            <AssetItem key={item.id} item={item} />
          ))}
        </ul>
      ) : adding ? null : (
        <p className="text-[13px] text-muted-foreground">{t("empty")}</p>
      )}

      {adding ? (
        <AddAssetForm
          contentId={contentId}
          platforms={platforms}
          onDone={() => setAdding(false)}
        />
      ) : null}
    </section>
  );
}

function AssetItem({ item }: { item: AssetView }) {
  const t = useTranslations();
  const [addingVersion, setAddingVersion] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string>();
  const latest = item.versions.at(-1);
  const number = item.versions.length;
  const older = item.versions.slice(0, -1).reverse();
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 [&+&]:border-t [&+&]:border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="font-semibold break-words">{item.label}</h3>
          <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-medium">
            {item.platform
              ? t(`content.platform.${item.platform}`)
              : t("contentEditor.assets.allPlatforms")}
          </span>
          {item.changed ? <SinceReviewBadge /> : null}
        </div>
        {item.canDelete ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            aria-label={t("contentEditor.assets.delete", { label: item.label })}
            disabled={deleting}
            onClick={() => {
              if (
                !confirm(
                  t("contentEditor.assets.confirmDelete", {
                    label: item.label,
                  }),
                )
              )
                return;
              startDelete(async () => {
                setError((await deleteAsset(item.id)).error);
              });
            }}
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {latest ? (
        <VersionLine
          version={latest}
          number={number}
          primary
          openLabel={t("contentEditor.assets.open", {
            version: t("contentEditor.assets.version", { number }),
          })}
        />
      ) : null}
      {error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {addingVersion ? (
        <AddVersionForm
          assetId={item.id}
          label={item.label}
          onDone={() => setAddingVersion(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="-ml-3"
            onClick={() => setAddingVersion(true)}
          >
            <PlusIcon aria-hidden="true" />
            {t("contentEditor.assets.addVersion")}
          </Button>
          {older.length ? (
            <details className="group w-full">
              <summary className="inline-flex h-7 cursor-pointer items-center rounded-full text-xs font-semibold text-accent-foreground underline-offset-4 hover:underline">
                {t("contentEditor.assets.allVersions", { count: number })}
              </summary>
              <ol className="mt-2 flex flex-col gap-3 border-l-2 border-border pl-4">
                {older.map((version, index) => {
                  const versionNumber = number - 1 - index;
                  return (
                    <li key={version.id}>
                      <VersionLine
                        version={version}
                        number={versionNumber}
                        openLabel={t("contentEditor.assets.open", {
                          version: t("contentEditor.assets.version", {
                            number: versionNumber,
                          }),
                        })}
                      />
                    </li>
                  );
                })}
              </ol>
            </details>
          ) : null}
        </div>
      )}
    </li>
  );
}

/** A version's link, who added it and when, and its note. */
function VersionLine({
  version,
  number,
  primary,
  openLabel,
}: {
  version: AssetVersionView;
  number: number;
  /** The newest one, which people should use, gets a button. */
  primary?: boolean;
  openLabel: string;
}) {
  const t = useTranslations("contentEditor.assets");
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <a
          href={version.url}
          target="_blank"
          rel="noreferrer"
          className={
            primary
              ? buttonVariants({ variant: "outline", size: "xs" })
              : "inline-flex items-center gap-1 text-[13px] font-semibold text-accent-foreground underline-offset-4 hover:underline"
          }
        >
          <ExternalLinkIcon aria-hidden="true" className="size-3" />
          {primary ? openLabel : t("version", { number })}
        </a>
        <span className="min-w-0 truncate text-[13px] text-muted-foreground">
          {hostOf(version.url)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <time dateTime={version.createdAt}>
            {t("addedBy", {
              name: version.byName ?? t("removedMember"),
              time: version.time,
            })}
          </time>
        </span>
      </div>
      {version.note ? (
        <p className="max-w-prose text-sm break-words whitespace-pre-wrap">
          {version.note}
        </p>
      ) : null}
    </div>
  );
}

function AddAssetForm({
  contentId,
  platforms,
  onDone,
}: {
  contentId: string;
  platforms: Platform[];
  onDone: () => void;
}) {
  const t = useTranslations();
  const id = useId();
  const [state, action, pending] = useActionState<AssetActionState, FormData>(
    async (previous, formData) => {
      const result = await addAsset(contentId, previous, formData);
      if (result.saved) onDone();
      return result;
    },
    {},
  );
  const suggestions = t("contentEditor.assets.labelSuggestions")
    .split(",")
    .map((label) => label.trim());
  return (
    <form
      action={action}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-xl bg-muted/60 p-4"
    >
      <h3 id={`${id}-title`} className="font-semibold">
        {t("contentEditor.assets.addTitle")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-label`}>
            {t("contentEditor.assets.label")}
          </Label>
          <Input
            id={`${id}-label`}
            name="label"
            list={`${id}-labels`}
            required
            maxLength={ASSET_LABEL_MAX_LENGTH}
            autoFocus
            aria-describedby={`${id}-label-hint`}
            className="bg-card"
          />
          <datalist id={`${id}-labels`}>
            {suggestions.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <p
            id={`${id}-label-hint`}
            className="pl-1 text-xs text-muted-foreground"
          >
            {t("contentEditor.assets.labelHint")}
          </p>
        </div>
        {platforms.length > 1 ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-platform`}>
              {t("contentEditor.assets.platform")}
            </Label>
            <NativeSelect
              id={`${id}-platform`}
              name="platform"
              defaultValue=""
              className="w-full"
              selectClassName="bg-card"
            >
              <NativeSelectOption value="">
                {t("contentEditor.assets.allPlatforms")}
              </NativeSelectOption>
              {platforms.map((platform) => (
                <NativeSelectOption key={platform} value={platform}>
                  {t(`content.platform.${platform}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <input type="hidden" name="platform" value="" />
        )}
      </div>
      <VersionFields id={id} />
      <FormFooter
        error={state.error}
        pending={pending}
        onCancel={onDone}
        submit={t("contentEditor.assets.add")}
        submitting={t("contentEditor.assets.adding")}
      />
    </form>
  );
}

function AddVersionForm({
  assetId,
  label,
  onDone,
}: {
  assetId: string;
  label: string;
  onDone: () => void;
}) {
  const t = useTranslations("contentEditor.assets");
  const id = useId();
  const [state, action, pending] = useActionState<AssetActionState, FormData>(
    async (previous, formData) => {
      const result = await addAssetVersion(assetId, previous, formData);
      if (result.saved) onDone();
      return result;
    },
    {},
  );
  return (
    <form
      action={action}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-xl bg-muted/60 p-4"
    >
      <div className="flex flex-col gap-1">
        <h4 id={`${id}-title`} className="font-semibold">
          {t("addVersionTitle", { label })}
        </h4>
        <p className="text-[13px] text-muted-foreground">
          {t("addVersionHint")}
        </p>
      </div>
      <VersionFields id={id} autoFocus />
      <FormFooter
        error={state.error}
        pending={pending}
        onCancel={onDone}
        submit={t("addVersion")}
        submitting={t("adding")}
      />
    </form>
  );
}

function VersionFields({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const t = useTranslations("contentEditor.assets");
  const tc = useTranslations("common");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-url`}>{t("link")}</Label>
        <Input
          id={`${id}-url`}
          name="url"
          type="url"
          inputMode="url"
          required
          placeholder="https://drive.google.com/…"
          autoFocus={autoFocus}
          aria-describedby={`${id}-url-hint`}
          className="bg-card"
        />
        <p id={`${id}-url-hint`} className="pl-1 text-xs text-muted-foreground">
          {t("linkHint")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-note`}>
          {t("note")}
          <span className="font-normal text-muted-foreground">
            {tc("optional")}
          </span>
        </Label>
        <Input
          id={`${id}-note`}
          name="note"
          maxLength={ASSET_NOTE_MAX_LENGTH}
          aria-describedby={`${id}-note-hint`}
          className="bg-card"
        />
        <p
          id={`${id}-note-hint`}
          className="pl-1 text-xs text-muted-foreground"
        >
          {t("noteHint")}
        </p>
      </div>
    </div>
  );
}

function FormFooter({
  error,
  pending,
  onCancel,
  submit,
  submitting,
}: {
  error?: string;
  pending: boolean;
  onCancel: () => void;
  submit: string;
  submitting: string;
}) {
  const t = useTranslations("common");
  return (
    <>
      {error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? submitting : submit}
        </Button>
      </div>
    </>
  );
}
