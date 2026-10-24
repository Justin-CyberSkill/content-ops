import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib";
import { Avatar } from "@/shared/ui/avatar";
import { CommentComposer } from "./comment-composer";
import { DeleteCommentButton } from "./delete-comment-button";

export type CommentView = {
  id: string;
  body: string;
  authorName: string | null;
  /** ISO time, for the <time> element. */
  createdAt: string;
  /** Already formatted in the team's time zone. */
  time: string;
  canDelete: boolean;
};

export function CommentThread({
  contentId,
  comments,
  className,
}: {
  contentId: string;
  comments: CommentView[];
  className?: string;
}) {
  const t = useTranslations("contentEditor.comments");
  return (
    <section
      aria-labelledby="comments-heading"
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="comments-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        {comments.length ? (
          <span className="text-[13px] text-muted-foreground">
            {t("count", { count: comments.length })}
          </span>
        ) : null}
      </div>

      {comments.length ? (
        <ol className="flex flex-col gap-5">
          {comments.map((comment) => {
            const name = comment.authorName ?? t("removedMember");
            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar name={name} size="sm" className="mt-0.5" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">{name}</span>
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-muted-foreground tabular-nums"
                    >
                      {comment.time}
                    </time>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
                {comment.canDelete ? (
                  <DeleteCommentButton id={comment.id} authorName={name} />
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-[13px] text-muted-foreground">{t("empty")}</p>
      )}

      <CommentComposer contentId={contentId} />
    </section>
  );
}
