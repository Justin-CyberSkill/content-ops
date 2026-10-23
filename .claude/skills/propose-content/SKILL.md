---
name: propose-content
description: Read CyberSkill's content plan and propose new content ideas to it through the Content Ops agent API. Use when asked to suggest, plan or propose social content, fill gaps in the content calendar, or check what happened to earlier proposals.
---

# Propose content to Content Ops

Content Ops is the team's content plan. Agents read the plan and propose ideas.
People decide: an admin approves a proposal (and assigns and dates it) or rejects it with a reason.
You can't edit, delete, approve or assign anything.

## Setup

You need two environment variables. Ask the person to set them if they're missing; never ask for the key in chat.

- `CONTENT_OPS_URL`: the app's address, such as `https://content-ops.example.com` or `http://localhost:3000`.
- `CONTENT_OPS_API_KEY`: an agent key. An admin creates one in Settings > Agents.

Send the key in the `x-api-key` header on every request. Responses are JSON.

## Workflow

1. **Learn from past proposals.** Read your earlier proposals first. Don't repeat rejected ideas, and apply what the rejection reasons ask for.
2. **Read the plan** for the period you're planning, so you fill gaps and don't clash with what's there.
3. **Propose** a few strong ideas, each with a clear goal and a specific "why".
4. Tell the person what you proposed, and that an admin reviews it in Content Ops.

## Read your past proposals

```bash
curl -s "$CONTENT_OPS_URL/api/agent/proposals" -H "x-api-key: $CONTENT_OPS_API_KEY"
```

Returns `{ "proposals": [...] }`, newest first, at most 50. Each has `id`, `idea`, `goal`, `why`, `createdAt`,
`state` (`pending`, `approved` or `rejected`) and `rejectionReason` (set when rejected).

## Read the plan

```bash
curl -s "$CONTENT_OPS_URL/api/agent/plan?from=2026-11-01&to=2026-11-30" -H "x-api-key: $CONTENT_OPS_API_KEY"
```

`from` and `to` are days (`YYYY-MM-DD`), at most 92 days apart. Without them you get today and the next 30 days.
Returns `{ "timeZone", "from", "to", "items": [...] }`. Each item has `id`, `goal`, `idea`, `platforms`, `type`, `publishDate`, `goldenTime`, `status` and `assignee`.
Dates and golden times are the team's local time in Vietnam (Asia/Ho_Chi_Minh).

## Propose an idea

```bash
curl -s -X POST "$CONTENT_OPS_URL/api/agent/proposals" \
  -H "x-api-key: $CONTENT_OPS_API_KEY" -H "content-type: application/json" \
  -d '{
    "goal": "Grow course sign-ups from young professionals",
    "idea": "Carousel: 5 phishing signs your team misses",
    "platforms": ["instagram", "linkedin"],
    "type": "carousel",
    "publishDate": "2026-11-06",
    "goldenTime": "20:00",
    "why": "Phishing posts got twice the saves of other topics last month, and the week has no carousel yet."
  }'
```

Fields:

| Field | Required | Value |
| --- | --- | --- |
| `goal` | yes | What we want and why, up to 1,000 characters. |
| `idea` | yes | The content idea, up to 2,000 characters. |
| `platforms` | yes | One or more of `facebook`, `instagram`, `tiktok`, `youtube`, `linkedin`, `x`, `threads`, `website`. |
| `type` | yes | One of `motion_video`, `short_video`, `long_video`, `live`, `image`, `carousel`, `text_post`, `quiz`, `article`. |
| `why` | yes | Why this idea, why now, and what it's based on, up to 2,000 characters. Admins decide from this. |
| `publishDate` | no | Suggested day, `YYYY-MM-DD`. |
| `goldenTime` | no | Suggested local time, `HH:MM` 24-hour. |
| `assetLinks` | no | Up to 20 `https` links to drafts or references. |

Any other field is rejected. A created proposal returns `201` with `{ "id", "state": "pending", "createdAt" }`.

## Errors

- `400`: the request didn't validate. `issues` lists each `field` and a `message`. Fix it and retry once.
- `401`: the key is missing, wrong, disabled, expired or wasn't made by an admin. Stop and tell the person.
- `429`: more than 30 requests a minute on this key. Wait for the number of seconds in `Retry-After`, then retry.
