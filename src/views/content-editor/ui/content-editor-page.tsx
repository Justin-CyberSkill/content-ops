import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { DEFAULT_LOCALE, isLocale, Link } from "@/shared/i18n";
import { buttonVariants } from "@/shared/ui/button";
import { getContent, listComments, listMembers } from "../api/queries";
import { formatCommentTime } from "../lib/format-comment-time";
import { emptyContentForm, toFormValues } from "../model/content-form";
import { CommentThread } from "./comment-thread";
import { ContentForm } from "./content-form";
import { DeleteContentButton } from "./delete-content-button";
import { ProposalCard } from "./proposal-card";
import { RejectProposalForm } from "./reject-proposal-form";

export async function generateNewMetadata(): Promise<Metadata> {
  const t = await getTranslations("contentEditor");
  return { title: t("newMetaTitle") };
}

export async function generateEditMetadata(): Promise<Metadata> {
  const t = await getTranslations("contentEditor");
  return { title: t("editMetaTitle") };
}

function Loading() {
  const t = useTranslations("common");
  return <p className="text-muted-foreground">{t("loading")}</p>;
}

export function NewContentPage() {
  const t = useTranslations("contentEditor");
  return (
    <Shell title={t("newTitle")}>
      <Suspense fallback={<Loading />}>
        <NewContentForm />
      </Suspense>
    </Shell>
  );
}

export function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("contentEditor");
  return (
    <Shell title={t("editTitle")}>
      <Suspense fallback={<Loading />}>
        <EditContentForm params={params} />
      </Suspense>
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("contentEditor");
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex items-center gap-3.5">
        <Link
          href="/content"
          aria-label={t("backToPlan")}
          className={buttonVariants({ variant: "outline", size: "icon-lg" })}
        >
          <ArrowLeftIcon aria-hidden="true" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-muted-foreground">
            {t("contentPlan")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
      </div>
      {children}
    </main>
  );
}

async function NewContentForm() {
  await requireUser();
  const members = await listMembers();
  return <ContentForm id={null} initial={emptyContentForm} members={members} />;
}

async function EditContentForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, me] = await Promise.all([params, requireUser()]);
  const [item, members] = await Promise.all([getContent(id), listMembers()]);
  if (!item) notFound();
  const isAdmin = me.role === "admin";
  const isProposal = item.status === "proposed";
  // Proposals are for admins to review; members only see them once approved.
  if (isProposal && !isAdmin) notFound();
  const pendingProposal = isProposal && item.rejectedAt === null;
  const [t, locale, comments] = await Promise.all([
    getTranslations("contentEditor"),
    getLocale(),
    listComments(item.id),
  ]);
  const now = new Date();
  return (
    <>
      {isProposal ? <ProposalCard item={item} /> : null}
      <ContentForm
        id={item.id}
        initial={toFormValues(item)}
        members={members}
        approving={pendingProposal}
        aside={
          isAdmin ? (
            <section
              aria-labelledby="delete-heading"
              className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card"
            >
              <div className="flex flex-col gap-1">
                <h2 id="delete-heading" className="text-lg font-semibold">
                  {t("deleteTitle")}
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  {t("deleteHint")}
                </p>
              </div>
              <DeleteContentButton id={item.id} />
            </section>
          ) : null
        }
      />
      {/* Same columns as the form, so the thread lines up under the brief. */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        {/* Outside the content form: a form can't hold another form. */}
        {pendingProposal ? (
          <div className="xl:col-start-2 xl:row-start-1">
            <RejectProposalForm id={item.id} />
          </div>
        ) : null}
        <CommentThread
          className="xl:col-start-1 xl:row-start-1"
          contentId={item.id}
          comments={comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            authorName: comment.authorName,
            createdAt: comment.createdAt.toISOString(),
            time: formatCommentTime(
              comment.createdAt,
              isLocale(locale) ? locale : DEFAULT_LOCALE,
              TEAM_TIME_ZONE,
              now,
            ),
            canDelete: isAdmin || comment.authorId === me.id,
          }))}
        />
      </div>
    </>
  );
}
