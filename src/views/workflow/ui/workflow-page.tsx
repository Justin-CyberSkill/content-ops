import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/shared/auth/index.server";
import { Link } from "@/shared/i18n";
import { getWorkflow } from "../api/queries";
import { WorkTypeList } from "./work-type-list";
import { WorkflowSteps } from "./workflow-steps";

export async function generateWorkTypesMetadata(): Promise<Metadata> {
  const t = await getTranslations("workflow");
  return { title: t("workTypesMetaTitle") };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("workflow");
  return { title: t("metaTitle") };
}

function Loading() {
  const t = useTranslations("common");
  return <p className="text-muted-foreground">{t("loading")}</p>;
}

/**
 * The Work types tab of Settings: the kinds of work, in order, and who does each.
 * The settings layout gives the page its heading and tabs.
 */
export function WorkTypesPage() {
  const t = useTranslations("workflow");
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">{t("workTypesIntro")}</p>
      <Suspense fallback={<Loading />}>
        <WorkTypes />
      </Suspense>
    </div>
  );
}

async function WorkTypes() {
  await requireAdmin();
  const [t, { workTypes, members }] = await Promise.all([
    getTranslations("workflow"),
    getWorkflow(),
  ]);
  return (
    <section
      aria-labelledby="work-types-heading"
      className="flex max-w-3xl min-w-0 flex-col gap-1 rounded-2xl bg-card p-3 shadow-card md:p-4"
    >
      <div className="flex flex-col gap-0.5 px-3 pt-2">
        <h2 id="work-types-heading" className="text-lg font-semibold">
          {t("workTypes")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("workTypesHint")}</p>
      </div>
      <WorkTypeList workTypes={workTypes} members={members} />
    </section>
  );
}

/**
 * The Workflow tab of Settings: which work each content type needs, one type at a time.
 * The settings layout gives the page its heading and tabs.
 */
export function WorkflowPage() {
  const t = useTranslations("workflow");
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">{t("intro")}</p>
      <Suspense fallback={<Loading />}>
        <Workflow />
      </Suspense>
    </div>
  );
}

async function Workflow() {
  await requireAdmin();
  const [t, { workTypes, steps }] = await Promise.all([
    getTranslations("workflow"),
    getWorkflow(),
  ]);
  if (!workTypes.length)
    return (
      <p className="text-muted-foreground">
        {t("needsWorkTypes")}{" "}
        <Link
          href="/settings/work-types"
          className="font-medium text-accent-foreground underline-offset-4 hover:underline"
        >
          {t("openWorkTypes")}
        </Link>
      </p>
    );
  return <WorkflowSteps workTypes={workTypes} steps={steps} />;
}
