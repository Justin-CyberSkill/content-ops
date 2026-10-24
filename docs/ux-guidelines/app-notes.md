# App notes

Facts about how this app works today, not design guidelines. Where one clashes with the guide, the guide wins: note the clash so the app can be aligned later.

## One word per concept

The same word in both languages and on every screen:

| Concept                  | EN              | VI                          |
| ------------------------ | --------------- | --------------------------- |
| Agent ideas page         | Proposals       | Đề xuất                     |
| Status `in_review`       | In review       | Chờ duyệt                   |
| Admin role               | Admin           | Quản trị viên (not "admin") |
| Agent credential         | API key         | Khoá API                    |
| Owner field              | Assignee        | Người phụ trách             |
| Publish date             | Publish day     | Ngày đăng                   |
| Agent takes back an idea | Withdraw        | Rút lại                     |
| What an idea is based on | Based on        | Dựa trên                    |
| Kind of work             | Work type       | Loại việc                   |
| One step of one idea     | Task            | Việc                        |
| Steps per content type   | Workflow        | Quy trình                   |
| Task not started yet     | Waiting         | Chưa tới lượt               |
| Task ready to work on    | To do           | Cần làm                     |
| Task finished            | Done            | Xong                        |
| When a task is due       | Due {day}       | Hạn {day}                   |
| What's said or shown     | Script          | Kịch bản                    |
| Text posted with it      | Caption         | Caption                     |
| A file made for an idea  | Asset           | Asset                       |
| Links to refer to        | Reference links | Link tham khảo              |
| Reviewer sends work back | Request changes | Yêu cầu sửa                 |
| Where a post went live   | Live link       | Link bài đăng               |

- Never reuse one word for two things. "Review" was renamed "Proposals" because it clashed with "In review". The Vietnamese calendar had three different "lịch" words. "Copy" is only the button, so the text is "captions", and "Asset links" became "Reference links" once assets got their own card.
- Open: "Overdue" is "Quá hạn" in the content plan and "Trễ hạn: {day}" on tasks. Pick one.
- Add a row when you add a concept people see, and search both message files for the old word when you rename one.

## EN and VI

- Strings live in `src/shared/i18n/messages/en.json` and `vi.json`. Every new string goes into both in the same change.
- Vietnamese is written for Vietnamese readers, not translated word for word: "{name} đề xuất", not "Đề xuất bởi {name}". Keep the English product words the team actually uses (agent, link, carousel).
- Work type names are the team's own data ("Content prep"), so they aren't translated.

## Routes and code

- Every URL starts with its language (`/en/…`, `/vi/…`). Link with `Link` from `@/shared/i18n`, which adds it.
- An item's URL sits under the list it was opened from: `/content/[id]`, `/my-tasks/[id]` or `/review/[id]`, built with `contentHref(id, origin)`. The sidebar highlights by pathname only. Don't read `useSearchParams` in the layout: under cacheComponents it causes a hydration mismatch.
- Dates use the team's time zone: `TEAM_TIME_ZONE` from `@/shared/config`.
- Components live in `src/shared/ui`; colour tokens in `src/app/globals.css`.

## Product decisions

- No calendar view (dropped 2026-10-24). The content plan grouped by week covers dates.

## Checks before you finish

1. Check at 390, 1280 and 1440+ px wide, in both languages, then press Back.
2. Run `pnpm lint && pnpm typecheck && pnpm test`.
