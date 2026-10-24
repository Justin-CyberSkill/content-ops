import { cn } from "cn";
import { useTranslations } from "next-intl";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// GitHub-flavoured, and a single line break stays a line break, as people type it in a textarea.
const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Images become links to them, so opening a page never loads files from other sites. */
function imagesAsLinks() {
  return (tree: HastNode) => {
    const walk = (node: HastNode, inLink: boolean) => {
      node.children = node.children?.map((child) => {
        if (child.type !== "element") return child;
        if (child.tagName === "img") {
          const src = String(child.properties?.src ?? "");
          const label = {
            type: "text",
            value: String(child.properties?.alt || src),
          };
          // A link can't hold another link, so inside one only the label stays.
          return inLink || !src
            ? label
            : {
                type: "element",
                tagName: "a",
                properties: { href: src },
                children: [label],
              };
        }
        walk(child, inLink || child.tagName === "a");
        return child;
      });
    };
    walk(tree, false);
  };
}

const REHYPE_PLUGINS = [imagesAsLinks];

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

function heading(depth: number, base: HeadingLevel): Components["h1"] {
  const Tag = `h${Math.min(6, base + depth - 1)}` as "h2";
  return ({ node: _, className, ...props }) => (
    <Tag
      className={cn(
        "mt-1.5 font-semibold first:mt-0",
        depth <= 2 && "text-[1.0625em]",
        className,
      )}
      {...props}
    />
  );
}

function components(headingLevel: HeadingLevel): Components {
  return {
    h1: heading(1, headingLevel),
    h2: heading(2, headingLevel),
    h3: heading(3, headingLevel),
    h4: heading(4, headingLevel),
    h5: heading(5, headingLevel),
    h6: heading(6, headingLevel),
    a: ({ node: _, href, className, ...props }) => {
      // An unsafe address, such as javascript:, arrives empty: keep the words, drop the link.
      if (!href) return <span {...props} />;
      const external = !href.startsWith("#");
      return (
        <a
          href={href}
          className={cn(
            "font-medium text-accent-foreground underline underline-offset-4 [overflow-wrap:anywhere]",
            className,
          )}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          {...props}
        />
      );
    },
    ul: ({ node: _, className, ...props }) => (
      <ul
        className={cn(
          "list-disc space-y-1 pl-5 marker:text-muted-foreground",
          className,
        )}
        {...props}
      />
    ),
    ol: ({ node: _, className, ...props }) => (
      <ol
        className={cn(
          "list-decimal space-y-1 pl-5 marker:text-muted-foreground",
          className,
        )}
        {...props}
      />
    ),
    li: ({ node: _, className, ...props }) => (
      <li
        className={cn(
          "pl-0.5 [&.task-list-item]:list-none [&>ol]:mt-1 [&>p+p]:mt-1 [&>ul]:mt-1",
          className,
        )}
        {...props}
      />
    ),
    input: ({ node: _, className, ...props }) => (
      <input
        className={cn("mr-1.5 align-[-2px] accent-primary", className)}
        {...props}
      />
    ),
    strong: ({ node: _, className, ...props }) => (
      <strong className={cn("font-semibold", className)} {...props} />
    ),
    code: ({ node: _, className, ...props }) => (
      <code
        className={cn(
          "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] [pre_&]:bg-transparent [pre_&]:p-0",
          className,
        )}
        {...props}
      />
    ),
    pre: ({ node: _, className, ...props }) => (
      <pre
        className={cn(
          "overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-xs leading-relaxed",
          className,
        )}
        {...props}
      />
    ),
    blockquote: ({ node: _, className, ...props }) => (
      <blockquote
        className={cn(
          "space-y-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground",
          className,
        )}
        {...props}
      />
    ),
    hr: ({ node: _, className, ...props }) => (
      <hr className={cn("border-border", className)} {...props} />
    ),
    table: ({ node: _, className, ...props }) => (
      <div className="max-w-full overflow-x-auto">
        <table
          className={cn("min-w-full border-collapse text-left", className)}
          {...props}
        />
      </div>
    ),
    th: ({ node: _, className, ...props }) => (
      <th
        className={cn(
          "border-b border-border px-2 py-1.5 align-bottom font-semibold",
          className,
        )}
        {...props}
      />
    ),
    td: ({ node: _, className, ...props }) => (
      <td
        className={cn(
          "border-b border-border px-2 py-1.5 align-top",
          className,
        )}
        {...props}
      />
    ),
  };
}

/**
 * Text people or agents wrote, read as Markdown. Raw HTML shows as the text it is and
 * unsafe links are dropped, so nothing in it runs. Render it on the server and pass
 * the result to client components, so the parser never ships to the browser.
 */
export function Markdown({
  children,
  className,
  headingLevel = 4,
}: {
  children: string;
  className?: string;
  /** The level a `#` heading gets, to fit under the headings around it. */
  headingLevel?: HeadingLevel;
}) {
  const t = useTranslations("common.markdown");
  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5 break-words", className)}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        remarkRehypeOptions={{
          footnoteLabel: t("footnotes"),
          footnoteBackLabel: (index) =>
            t("backToReference", { number: index + 1 }),
        }}
        components={components(headingLevel)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const INLINE = ["strong", "em", "del", ...HEADINGS];

// In a run of words a heading is a bold label, so it doesn't merge into the sentence after it.
const PREVIEW_COMPONENTS: Components = Object.fromEntries(
  HEADINGS.map((tag) => [
    tag,
    ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
  ]),
);

/**
 * The same text as one run of words for a list row or card, inside an element that
 * clamps or truncates it. Blocks, lists and links flatten into the line, since the
 * whole row is already a link.
 */
export function MarkdownPreview({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      remarkRehypeOptions={{ footnoteLabel: "", footnoteBackContent: "" }}
      allowedElements={INLINE}
      unwrapDisallowed
      components={PREVIEW_COMPONENTS}
    >
      {children}
    </ReactMarkdown>
  );
}
