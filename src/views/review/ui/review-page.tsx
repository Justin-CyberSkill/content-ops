import { CheckIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/shared/auth/index.server";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { Link } from "@/shared/i18n";
import { listPendingProposals } from "../api/list-proposals";
import { ProposalList } from "./proposal-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("review");
  return { title: t("metaTitle") };
}

export function ReviewPage({ searchParams }: PageProps<"/[locale]/review">) {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("review.title")}
        </h1>
        <p className="text-muted-foreground">{t("review.intro")}</p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t("common.loading")}</p>
        }
      >
        <Proposals searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Proposals({
  searchParams,
}: Pick<PageProps<"/[locale]/review">, "searchParams">) {
  await requireAdmin();
  const [{ done }, proposals, t] = await Promise.all([
    searchParams,
    listPendingProposals(),
    getTranslations("review"),
  ]);
  return (
    <>
      {done === "approved" || done === "rejected" ? (
        <DoneNotice done={done} />
      ) : null}
      {proposals.length ? (
        <p className="-mb-2 text-sm font-medium">
          {t("waiting", { count: proposals.length })}
        </p>
      ) : null}
      <ProposalList proposals={proposals} timeZone={TEAM_TIME_ZONE} />
    </>
  );
}

/** What the last decision did, after the decision page sends you back here. */
function DoneNotice({ done }: { done: "approved" | "rejected" }) {
  const t = useTranslations("review");
  const approved = done === "approved";
  const Icon = approved ? CheckIcon : XIcon;
  return (
    <p
      role="status"
      className="flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-success-soft px-5 py-3.5 text-sm"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-success" />
      <span>{approved ? t("doneApproved") : t("doneRejected")}</span>
      {approved ? (
        <Link
          href="/content"
          className="font-semibold text-accent-foreground underline-offset-4 hover:underline"
        >
          {t("openPlan")}
        </Link>
      ) : null}
    </p>
  );
}
