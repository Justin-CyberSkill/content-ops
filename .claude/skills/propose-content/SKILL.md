---

name: propose-content
description: Plan CyberSkill social content with the person and keep their pending ideas in Content Ops up to date. Use when asked to brainstorm or propose content from meetings, GitHub or the roadmap, to fill gaps in the content plan, to change or withdraw pending ideas, or to check what happened to earlier proposals.
---

# Plan content with Content Ops

Content Ops is the team's content plan. You brainstorm with the person, and when they agree on an idea you add it to Content Ops as **pending**. An admin then approves it (and it becomes tasks for the team) or rejects it with a reason.

You can add pending ideas, change them, and withdraw them. You can't approve, reject, assign or touch an idea after an admin decides on it.

## Connect

Use the MCP server when you have it. Check with `claude mcp list`; it's named `content-ops`.

If it isn't there, ask the person to add it. An admin creates an API key in Content Ops under Agents, which shows the exact command:

```bash
claude mcp add --transport http content-ops https://<content-ops-address>/api/mcp --header "x-api-key: csops_…"
```

Never ask for the key in chat. Without MCP, use the REST API below with `CONTENT_OPS_URL` and `CONTENT_OPS_API_KEY` set in the environment.

## Workflow

1. **Gather and summarise.** Read what the person points you to: meeting notes, GitHub issues, PRs, the roadmap, feature pages (Practice projects, certificates, brain training games). Summarise what's new and what's worth talking about.
2. **Check what's already there.** `list_ideas` with `state: "pending"` for ideas waiting on the admin, and `state: "rejected"` to learn from rejection reasons. `read_plan` for the coming weeks, so you fill gaps instead of clashing. Use `list_ideas` with `source` to find an idea already based on the same meeting or issue.
3. **Brainstorm in chat.** Suggest a few ideas, each with a goal, format, platforms, a suggested day and a specific why. Let the person pick, merge and reword. Don't add anything they haven't agreed to.
4. **Add or update.** For each idea they agree to, `propose_idea`. If a pending idea already covers it, `update_idea` instead of adding a duplicate. Put what it's based on in `sources`: links to issues and PRs, or short labels like `Weekly meeting 23 Oct`.
5. **Tidy up.** When the person drops a pending idea, or a new one replaces it, `withdraw_idea` with a short reason.
6. **Report back.** List what you added, changed and withdrew, and say the admin decides in Content Ops under Proposals.

If `update_idea` or `withdraw_idea` says the idea is no longer pending, the admin already decided. Tell the person, and propose a new idea if they still want the change.

## MCP tools

| Tool            | What it does                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `read_plan`     | Approved content between `from` and `to` (`YYYY-MM-DD`, at most 92 days). Defaults to the next 30 days.                                        |
| `list_ideas`    | Ideas agents proposed, newest first. Filters: `state` (`pending`, `approved`, `rejected`, `withdrawn`), `source`, `mine`, `limit` (up to 100). |
| `get_idea`      | One idea with the team's comments and its history. Read comments before changing an idea: the admin may have asked for something.              |
| `propose_idea`  | Add a pending idea. Fields below.                                                                                                              |
| `update_idea`   | Change a pending idea. Send `id` and only the fields to change; `null` clears `publishDate` or `goldenTime`. The admin sees what changed.      |
| `withdraw_idea` | Take a pending idea out of Proposals, with an optional `reason`. The admin can restore it.                                                     |

Idea fields:

| Field         | Required | Value                                                                                                            |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `goal`        | yes      | What we want and why, up to 1,000 characters.                                                                    |
| `idea`        | yes      | The content idea, up to 2,000 characters.                                                                        |
| `platforms`   | yes      | One or more of `facebook`, `instagram`, `tiktok`, `youtube`, `linkedin`, `x`, `threads`, `website`.              |
| `type`        | yes      | One of `motion_video`, `short_video`, `long_video`, `live`, `image`, `carousel`, `text_post`, `quiz`, `article`. |
| `why`         | yes      | Why this idea, why now, and what it's based on, up to 2,000 characters. The admin decides from this.             |
| `sources`     | no       | Up to 10 links or short labels the idea is based on, 300 characters each.                                        |
| `publishDate` | no       | Suggested day, `YYYY-MM-DD`.                                                                                     |
| `goldenTime`  | no       | Suggested local time, `HH:MM` 24-hour.                                                                           |
| `assetLinks`  | no       | Up to 20 `https` links to drafts or references.                                                                  |

Days and times are the team's local time in Vietnam (Asia/Ho_Chi_Minh).

## REST API

The same actions over HTTP, for agents without MCP. Send the key in the `x-api-key` header (or `Authorization: Bearer`). Bodies and responses are JSON.

| Request                                                    | Does                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /api/agent/plan?from=&to=`                            | `read_plan`                                                            |
| `GET /api/agent/proposals?state=&source=&mine=true&limit=` | `list_ideas`, as `{ "proposals": [...] }`                              |
| `GET /api/agent/proposals/:id`                             | `get_idea`                                                             |
| `POST /api/agent/proposals`                                | `propose_idea`; returns `201` with the idea                            |
| `PATCH /api/agent/proposals/:id`                           | `update_idea`; returns the idea and `changed`, the fields that changed |
| `DELETE /api/agent/proposals/:id`                          | `withdraw_idea`; optional body `{ "reason": "…" }`                     |

```bash
curl -s -X POST "$CONTENT_OPS_URL/api/agent/proposals" \
  -H "x-api-key: $CONTENT_OPS_API_KEY" -H "content-type: application/json" \
  -d '{
    "goal": "Show that the brain games are quick and fun",
    "idea": "Short video: can you beat our 30-second memory game?",
    "platforms": ["tiktok", "facebook"],
    "type": "short_video",
    "publishDate": "2026-11-06",
    "goldenTime": "20:00",
    "why": "The roadmap sync ranked brain games first for Q4, and the plan has no video that week.",
    "sources": ["https://github.com/cyberskill-official/practice/issues/42", "Roadmap sync 20 Oct"]
  }'
```

Each idea has `id`, `state`, `idea`, `goal`, `why`, `platforms`, `type`, `publishDate`, `goldenTime`, `assetLinks`, `sources`, `proposedBy`, `createdAt`, `updatedAt`, `rejectionReason` and `withdrawReason`.

## Errors

- `400` or a tool error: the input didn't validate. `issues` lists each `field` and a `message`. Fix it and retry once. Unknown fields are rejected.
- `401`: the key is missing, wrong, disabled, expired or wasn't made by an admin. Stop and tell the person.
- `404`: no idea has that id.
- `409`: the idea isn't pending any more; `state` says what happened to it.
- `429`: more than 30 requests a minute on this key. Wait for the seconds in `Retry-After`, then retry.
