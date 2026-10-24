# UX guidelines

Rules the app already follows. Keep new screens consistent with them. Visual tokens live in `src/app/globals.css`; this file is about layout, flow and words.

## Core idea

Each screen answers three questions for a first-time user, in this order: what is this, what do I need to know, what can I do. Show one task at a time.

## Page pattern

- **Read first.** A detail page opens as read-only facts (label over value), not as a form.
- **Main action in a side panel.** From `xl`: grid `minmax(0,1fr) | minmax(20rem,24rem)`. Content and comments on the left; the action panel on the right, `xl:sticky xl:top-8`, spanning both rows. Below `xl`: one column in DOM order content → action → comments. Use one DOM order and grid placement, never duplicate markup per breakpoint.
- **Forms on demand.** "Edit details" swaps the read view for the full form at full width. Cancel goes back to the read view (`onCancel`), not away from the page.
- **Quick change for the common edit.** Item page: status and owner save from the panel (`updateProgress`) without opening the form. Save stays disabled until something changes; show "Saved" after.
- **Choices as whole-row buttons**, each with a title and one line saying what happens (proposal: Approve / Edit, then approve / Reject). Make the safe or most common one primary.
- **Agents change ideas, people decide.** A proposal shows its History (who proposed, changed, withdrew or restored it). Approving checks the version on screen: if an agent changed it meanwhile, say so and show the new version instead of approving it unseen.
- **Rare, destructive actions stay quiet.** For example, Delete is a small button with a hint under the panel, not a card of its own. Confirm before deleting. Hide actions that don't apply (no Delete on a pending proposal; Reject covers it).
- **Lists:** one item per row or card, all the same height. Clicking anywhere on it opens the item (a link with `after:absolute after:inset-0`). Group lists by what matters next: content plan by week (Overdue, This week, Next week, Later, No date, Published folded at the bottom); My tasks into To do and Published, each with a count.
- **Fill the width without stretching text.** Use two columns on wide screens instead of `max-w` boxes that leave half the page empty. Show facts 2 per row, or 4 per row from `2xl`.

## Navigation and wayfinding

- An item's URL sits under the list it was opened from: `/content/[id]`, `/my-tasks/[id]` or `/review/[id]`, built with `contentHref(id, origin)`. The sidebar highlights by pathname only. Don't read `useSearchParams` in the layout: under cacheComponents it causes a hydration mismatch.
- The item header is: back button (icon, `aria-label` "Back to {list}"), the list name above, the item's own name as the h1 and in `<title>`, and the status badge plus publish date.
- Back, Cancel, Save and Delete all return to the origin list. After a decision, say what happened on arrival (`/review?done=approved|rejected` shows a status line with a next link).
- Phone: a fixed bottom tab bar (`--bottom-nav`) holds every section; pages pad for it. The item header sticks to the top. A form's Save bar sticks above the tab bar. Put the fields people change most first.
- No calendar view (dropped 2026-10-24). The content plan grouped by week covers dates.

## States

- **Empty state:** an icon, a title saying what is missing, one line on what will appear here, and a button to the next step (Add content, Open content plan, Manage agents).
- **Loading:** placeholders keep the final size so nothing jumps.
- **Errors:** next to the action that failed, `role="alert"`, saying how to fix it. Confirmations use `role="status"`.

## Words (EN and VI)

- Write as a teammate would say it. Short sentences, active voice, sentence case.
- Buttons are verbs that say the result: "Add content", "Approve and add to plan", "Save and approve", "Send". Not "Submit", "OK" or a noun.
- An intro line under each h1 says what the page is for and what you can do there.
- Hints say the consequence: "It goes into the content plan as Planned, exactly as shown." Don't say "above" or "on the left": the layout changes with the screen.
- One word per concept, the same in both languages and on every screen:

  | Concept                  | EN          | VI                          |
  | ------------------------ | ----------- | --------------------------- |
  | Agent ideas page         | Proposals   | Đề xuất                     |
  | Status `in_review`       | In review   | Chờ duyệt                   |
  | Admin role               | Admin       | Quản trị viên (not "admin") |
  | Agent credential         | API key     | Khoá API                    |
  | Owner field              | Assignee    | Người phụ trách             |
  | Publish date             | Publish day | Ngày đăng                   |
  | Agent takes back an idea | Withdraw    | Rút lại                     |
  | What an idea is based on | Based on    | Dựa trên                    |

- Never reuse one word for two things. "Review" was renamed "Proposals" because it clashed with "In review". The Vietnamese calendar had three different "lịch" words.
- Vietnamese is written for Vietnamese readers, not translated word for word: "{name} đề xuất", not "Đề xuất bởi {name}". Keep the English product words the team actually uses (agent, link, carousel).
- Every new string goes into both `en.json` and `vi.json` in the same change.

## Before you finish UI work

1. Check at 390, 1280 and 1440+ px wide, in both languages.
2. The page must not scroll sideways. Tap targets must be at least 24 px.
3. Test the main flow by clicking through it, then press Back.
4. Run `pnpm lint && pnpm typecheck && pnpm test`.
