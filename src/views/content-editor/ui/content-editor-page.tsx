import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  type ContentOrigin,
  formatSchedule,
  originHref,
  StatusBadge,
} from "@/entities/content";
import { taskKind, todayIn } from "@/entities/task";
import { listTasks, planWork } from "@/entities/task/index.server";
import { requireUser } from "@/shared/auth/index.server";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { DEFAULT_LOCALE, isLocale, Link } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import { Markdown } from "@/shared/ui/markdown";
import { listAssets, listPosts, listReviews } from "../api/production";
import {
  getContent,
  listComments,
  listEvents,
  listMembers,
} from "../api/queries";
import { formatCommentTime } from "../lib/format-comment-time";
import { postText } from "../model/captions";
import { emptyContentForm, toFormValues } from "../model/content-form";
import { AssetsCard } from "./assets-card";
import { CommentThread } from "./comment-thread";
import { ContentForm } from "./content-form";
import { ContentSummary } from "./content-summary";
import { ContentView } from "./content-view";
import { DeleteContentButton } from "./delete-content-button";
import { ProposalCard } from "./proposal-card";
import { ProposalReview } from "./proposal-review";
import { PublishPanel } from "./publish-panel";
import { RestoreProposal } from "./restore-proposal";
import { ReviewHistory } from "./review-history";
import { ScriptAndCaptions } from "./script-and-captions";
import { VerdictPanel } from "./verdict-panel";

// The same item page sits under each list it opens from: /content/[id], /my-tasks/[id]
// and /review/[id]. The path says where you are, so the sidebar and Back follow it.
type EditProps = { params: Promise<{ id: string }> };

// Long ideas would crowd the browser tab, so the title keeps the start of one.
const TITLE_LENGTH = 60;

export async function generateNewMetadata(): Promise<Metadata> {
  const t = await getTranslations("contentEditor");
  return { title: t("newMetaTitle") };
}

export async function generateEditMetadata({
  params,
}: EditProps): Promise<Metadata> {
  const { id } = await params;
  const [t, item] = await Promise.all([
    getTranslations("contentEditor"),
    getContent(id),
  ]);
  if (!item) return { title: t("editMetaTitle") };
  const idea =
    item.idea.length > TITLE_LENGTH
      ? `${item.idea.slice(0, TITLE_LENGTH - 1).trimEnd()}…`
      : item.idea;
  return { title: t("itemMetaTitle", { idea }) };
}

function Loading() {
  const t = useTranslations("common");
  return <p className="text-muted-foreground">{t("loading")}</p>;
}

export function NewContentPage() {
  const t = useTranslations("contentEditor");
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 pb-8 md:pt-8 md:pr-8 md:pl-2">
      <PageHeader from="plan" title={t("newTitle")} />
      <Suspense fallback={<Loading />}>
        <NewContentForm />
      </Suspense>
    </main>
  );
}

function EditShell({ params, from }: EditProps & { from: ContentOrigin }) {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 pb-8 md:pt-8 md:pr-8 md:pl-2">
      <Suspense fallback={<EditLoading />}>
        <EditContent params={params} from={from} />
      </Suspense>
    </main>
  );
}

export function EditContentPage({ params }: EditProps) {
  return <EditShell params={params} from="plan" />;
}

export function TaskContentPage({ params }: EditProps) {
  return <EditShell params={params} from="tasks" />;
}

export function ReviewContentPage({ params }: EditProps) {
  return <EditShell params={params} from="review" />;
}

const sectionLabel = {
  plan: "nav.contentPlan",
  tasks: "nav.myTasks",
  review: "nav.review",
} as const;

/**
 * Names the list the item was opened from and goes back to it. On phones it stays
 * at the top while the long form scrolls, so the way out is always in reach.
 */
function PageHeader({
  from,
  title,
  meta,
}: {
  from: ContentOrigin;
  title: string;
  meta?: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3.5 bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Link
          href={originHref(from)}
          aria-label={t(`contentEditor.backTo.${from}`)}
          className={buttonVariants({
            variant: "outline",
            size: "icon-lg",
            className: "shrink-0",
          })}
        >
          <ArrowLeftIcon aria-hidden="true" />
        </Link>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">
            {t(sectionLabel[from])}
          </span>
          <h1 className="line-clamp-3 text-xl font-semibold tracking-tight break-words md:line-clamp-2 md:text-3xl">
            {title}
          </h1>
          {meta ? (
            <div className="mt-1 hidden flex-wrap items-center gap-2 text-sm text-muted-foreground md:flex">
              {meta}
            </div>
          ) : null}
        </div>
      </div>
      {/* Phones keep the sticky bar short, so where the item stands shows just under it. */}
      {meta ? (
        <div className="-mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:hidden">
          {meta}
        </div>
      ) : null}
    </>
  );
}

/** Holds the header's place, so the form doesn't jump when the item arrives. */
function EditLoading() {
  return (
    <>
      <div className="flex items-center gap-3.5 py-3 md:py-0">
        <span
          aria-hidden="true"
          className={buttonVariants({ variant: "outline", size: "icon-lg" })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="h-4 w-24 rounded-full bg-muted-strong" />
          <span className="h-7 w-64 max-w-full rounded-full bg-muted-strong md:h-9" />
        </div>
      </div>
      <Loading />
    </>
  );
}

async function NewContentForm() {
  const me = await requireUser();
  const [members, plan] = await Promise.all([listMembers(), planWork()]);
  return (
    <ContentForm
      id={null}
      from="plan"
      initial={emptyContentForm}
      members={members}
      plan={plan}
      today={todayIn(TEAM_TIME_ZONE)}
      canSetUp={me.role === "admin"}
    />
  );
}

async function EditContent({
  params,
  from: origin,
}: EditProps & { from: ContentOrigin }) {
  const [{ id }, me] = await Promise.all([params, requireUser()]);
  const [item, members] = await Promise.all([getContent(id), listMembers()]);
  if (!item) notFound();
  const isAdmin = me.role === "admin";
  const isProposal = item.status === "proposed";
  // Proposals are for admins to review; members only see them once approved.
  if (isProposal && !isAdmin) notFound();
  const pendingProposal =
    isProposal && item.rejectedAt === null && item.withdrawnAt === null;
  const [t, locale, comments, events, tasks, posts, assets, reviews] =
    await Promise.all([
      getTranslations("contentEditor"),
      getLocale(),
      listComments(item.id),
      isProposal ? listEvents(item.id) : [],
      isProposal ? [] : listTasks(item.id),
      isProposal ? [] : listPosts(item.id),
      isProposal ? [] : listAssets(item.id),
      isProposal ? [] : listReviews(item.id),
    ]);
  // Who's suggested per step: for approving, or for splitting an item from before tasks.
  const plan =
    pendingProposal || (isAdmin && !isProposal && !tasks.length)
      ? await planWork()
      : null;
  const now = new Date();
  const today = todayIn(TEAM_TIME_ZONE, now);
  const readerLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  // A proposal reached through the plan's address still belongs to Review.
  const from = isProposal ? "review" : origin;
  const schedule = formatSchedule(
    item.publishDate,
    item.goldenTime,
    readerLocale,
  );
  const assigneeName =
    members.find((member) => member.id === item.assigneeId)?.name ?? null;
  const commentThread = (
    <CommentThread
      contentId={item.id}
      comments={comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        authorName: comment.authorName,
        createdAt: comment.createdAt.toISOString(),
        time: formatCommentTime(
          comment.createdAt,
          readerLocale,
          TEAM_TIME_ZONE,
          now,
        ),
        canDelete: isAdmin || comment.authorId === me.id,
      }))}
    />
  );
  // Rare and permanent, so it sits quietly under the panel rather than in a card of its own.
  const deleteCard = (
    <div className="flex flex-col items-start gap-1.5 px-2">
      <DeleteContentButton id={item.id} from={from} />
      <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
    </div>
  );

  if (isProposal) {
    // Read, then decide: a summary and three choices instead of the whole form at once.
    const summary = (
      <ProposalCard
        item={item}
        proposedAt={formatCommentTime(
          item.createdAt,
          readerLocale,
          TEAM_TIME_ZONE,
          now,
        )}
        schedule={schedule}
        history={events.map((event) => ({
          ...event,
          time: formatCommentTime(
            event.createdAt,
            readerLocale,
            TEAM_TIME_ZONE,
            now,
          ),
        }))}
      />
    );
    return (
      <>
        <PageHeader
          from={from}
          title={item.idea}
          meta={
            <>
              {item.rejectedAt || item.withdrawnAt ? (
                // A closed proposal isn't "Proposed" any more; say what happened instead.
                <Badge
                  className={
                    item.rejectedAt
                      ? "bg-destructive-soft text-destructive"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {item.rejectedAt
                    ? t("proposal.rejectedTitle")
                    : t("proposal.withdrawn")}
                </Badge>
              ) : (
                <StatusBadge status={item.status} />
              )}
              {schedule ? (
                <span className="tabular-nums">{schedule}</span>
              ) : null}
            </>
          }
        />
        {pendingProposal ? (
          <ProposalReview
            id={item.id}
            revision={item.revision}
            from={from}
            initial={toFormValues(item)}
            members={members}
            plan={plan ?? (await planWork())}
            today={today}
            summary={summary}
            comments={commentThread}
          />
        ) : item.withdrawnAt ? (
          // Withdrawn by an agent: the record, and a way to bring it back. Delete stays quiet below.
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:grid-rows-[auto_1fr] xl:items-start">
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
              {summary}
            </div>
            <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">
              <RestoreProposal id={item.id} />
              {deleteCard}
            </div>
            <div className="min-w-0 xl:col-start-1 xl:row-start-2">
              {commentThread}
            </div>
          </div>
        ) : (
          // Already rejected: the record and its reason, with delete beside it.
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              {summary}
              {commentThread}
            </div>
            {deleteCard}
          </div>
        )}
      </>
    );
  }

  const time = (at: Date) =>
    formatCommentTime(at, readerLocale, TEAM_TIME_ZONE, now);
  // What changed after the last review gets a badge, so the reviewer checks only that.
  const lastReviewAt = reviews[0]?.createdAt ?? null;
  const changedSinceReview = (at: Date | null) =>
    lastReviewAt !== null && at !== null && at > lastReviewAt;
  const postOf = (platform: (typeof item.platforms)[number]) =>
    posts.find((row) => row.platform === platform);

  // The open task decides the panel's next card: a review's decision, or the live links.
  const openTask = tasks.find((task) => task.status !== "done") ?? null;
  const canAct = (assigneeId: string | null) => isAdmin || assigneeId === me.id;
  const publishTask =
    tasks.find(
      (task) =>
        taskKind(task.ideaStatus) === "publish" && task.status !== "done",
    ) ?? tasks.findLast((task) => taskKind(task.ideaStatus) === "publish");
  let actions: React.ReactNode = null;
  if (
    openTask &&
    taskKind(openTask.ideaStatus) === "review" &&
    openTask.status !== "waiting" &&
    canAct(openTask.assigneeId)
  ) {
    const next = tasks.find(
      (task) => task.position > openTask.position && task.status !== "done",
    );
    actions = (
      <VerdictPanel
        taskId={openTask.id}
        earlier={tasks
          .filter(
            (task) =>
              task.position < openTask.position && task.status === "done",
          )
          .map((task) => ({
            id: task.id,
            name: task.name,
            assigneeName: task.assigneeName,
          }))}
        next={
          next
            ? { id: next.id, name: next.name, assigneeName: next.assigneeName }
            : null
        }
        reviewedBefore={reviews.length > 0}
      />
    );
  } else if (publishTask && publishTask.status !== "waiting") {
    actions = (
      <PublishPanel
        contentId={item.id}
        taskName={publishTask.name}
        canEdit={canAct(publishTask.assigneeId)}
        rows={item.platforms.map((platform) => {
          const row = postOf(platform);
          return {
            platform,
            postText: postText(row?.caption ?? "", row?.hashtags ?? ""),
            pinnedComment: row?.pinnedComment ?? "",
            liveUrl: row?.liveUrl ?? null,
            publishedByName: row?.publishedByName ?? null,
            publishedTime: row?.publishedAt ? time(row.publishedAt) : null,
          };
        })}
      />
    );
  }

  const work = (
    <>
      <ScriptAndCaptions
        contentId={item.id}
        script={item.script}
        scriptView={
          <Markdown className="max-w-prose text-sm" headingLevel={5}>
            {item.script}
          </Markdown>
        }
        scriptChanged={changedSinceReview(item.scriptUpdatedAt)}
        posts={item.platforms.map((platform) => {
          const row = postOf(platform);
          return {
            platform,
            caption: row?.caption ?? "",
            hashtags: row?.hashtags ?? "",
            pinnedComment: row?.pinnedComment ?? "",
            changed: changedSinceReview(row?.copyUpdatedAt ?? null),
          };
        })}
      />
      <AssetsCard
        contentId={item.id}
        platforms={item.platforms}
        assets={assets.map((asset) => ({
          id: asset.id,
          label: asset.label,
          platform: asset.platform,
          changed: changedSinceReview(asset.versions.at(-1)?.createdAt ?? null),
          canDelete: isAdmin || asset.createdById === me.id,
          versions: asset.versions.map((version) => ({
            id: version.id,
            url: version.url,
            note: version.note,
            byName: version.createdByName,
            createdAt: version.createdAt.toISOString(),
            time: time(version.createdAt),
          })),
        }))}
      />
      {reviews.length ? (
        <ReviewHistory
          reviews={reviews.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
            time: time(entry.createdAt),
          }))}
        />
      ) : null}
    </>
  );

  return (
    <>
      <PageHeader
        from={from}
        title={item.idea}
        meta={
          <>
            <StatusBadge status={item.status} />
            {schedule ? <span className="tabular-nums">{schedule}</span> : null}
          </>
        }
      />
      <ContentView
        id={item.id}
        from={from}
        initial={toFormValues(item)}
        members={members}
        tasks={tasks.map((task) => ({
          id: task.id,
          name: task.name,
          status: task.status,
          assigneeId: task.assigneeId,
          assigneeName: task.assigneeName,
          dueDate: task.dueDate,
          daysBefore: task.daysBefore,
          doers: task.doers,
          kind: taskKind(task.ideaStatus),
          changesRequested: task.changesRequested && {
            by: task.changesRequested.by,
            note: <Markdown>{task.changesRequested.note}</Markdown>,
          },
        }))}
        steps={plan?.[item.type] ?? []}
        me={{ id: me.id, isAdmin }}
        today={today}
        summary={
          <ContentSummary
            item={item}
            schedule={schedule}
            assigneeName={assigneeName}
            origin={
              item.proposedByName
                ? {
                    agent: item.proposedByName,
                    approvedBy:
                      members.find((member) => member.id === item.reviewedById)
                        ?.name ?? null,
                  }
                : undefined
            }
          />
        }
        work={work}
        actions={actions}
        comments={commentThread}
        danger={isAdmin ? deleteCard : undefined}
      />
    </>
  );
}
