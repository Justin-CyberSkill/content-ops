import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/shared/auth/index.server";
import { CONTENT_TYPES } from "@/shared/db/schema";
import { getWorkflow } from "../api/queries";
import { AddWorkTypeForm } from "./add-work-type-form";
import { StepsCard } from "./steps-card";
import { WorkTypeList } from "./work-type-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("workflow");
  return { title: t("metaTitle") };
}

/** The Workflow tab of Settings: the settings layout gives the page its heading and tabs. */
export function WorkflowPage() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">{t("workflow.intro")}</p>
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t("common.loading")}</p>
        }
      >
        <Workflow />
      </Suspense>
    </div>
  );
}

async function Workflow() {
  await requireAdmin();
  const [t, { workTypes, steps, members }] = await Promise.all([
    getTranslations("workflow"),
    getWorkflow(),
  ]);
  return (
    <div className="flex flex-col gap-10">
      {/* Who does what leads; adding a kind of work sits beside it, as on Members. */}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
        <section
          aria-labelledby="work-types-heading"
          className="flex min-w-0 flex-col gap-1 rounded-2xl bg-card p-3 shadow-card md:p-4"
        >
          <div className="flex flex-col gap-0.5 px-3 pt-2">
            <h2 id="work-types-heading" className="text-lg font-semibold">
              {t("workTypes")}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {t("workTypesHint")}
            </p>
          </div>
          {workTypes.length ? (
            <WorkTypeList workTypes={workTypes} members={members} />
          ) : (
            <p className="px-3 py-4 text-muted-foreground">
              {t("noWorkTypes")}
            </p>
          )}
        </section>
        <section
          aria-labelledby="add-work-type-heading"
          className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card xl:sticky xl:top-8"
        >
          <div className="flex flex-col gap-1">
            <h2 id="add-work-type-heading" className="text-lg font-semibold">
              {t("addWorkType")}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {t("addWorkTypeHint")}
            </p>
          </div>
          <AddWorkTypeForm />
        </section>
      </div>

      <section aria-labelledby="steps-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5 px-1">
          <h2 id="steps-heading" className="text-lg font-semibold">
            {t("stepsTitle")}
          </h2>
          <p className="text-[13px] text-muted-foreground">{t("stepsHint")}</p>
        </div>
        {workTypes.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] gap-5">
            {CONTENT_TYPES.map((contentType) => (
              <StepsCard
                key={contentType}
                contentType={contentType}
                workTypes={workTypes}
                steps={steps.filter((step) => step.contentType === contentType)}
              />
            ))}
          </div>
        ) : (
          <p className="px-1 text-muted-foreground">{t("noWorkTypes")}</p>
        )}
      </section>
    </div>
  );
}
