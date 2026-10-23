import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/shared/auth/index.server";
import { listPendingProposals } from "../api/list-proposals";
import { ProposalList } from "./proposal-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("review");
  return { title: t("metaTitle") };
}

export function ReviewPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-1">
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
        <Proposals />
      </Suspense>
    </main>
  );
}

async function Proposals() {
  await requireAdmin();
  return <ProposalList proposals={await listPendingProposals()} />;
}
