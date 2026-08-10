---
name: xurl
description: Use the authenticated X (Twitter) API to search or read posts, research practitioner knowledge using public X and optional synced private bookmarks, publish, reply, quote, manage followers or DMs, and upload media.
---

# xurl — Agent Skill Reference

`xurl` is a CLI tool for the X API. It supports both **shortcut commands** (human/agent‑friendly one‑liners) and **raw curl‑style** access to any v2 endpoint. All commands return JSON to stdout.

---

## Prerequisites

This skill requires the `xurl` CLI utility: <https://github.com/xdevplatform/xurl>.

Before using any command you must be authenticated. Run `xurl auth status` to check.

Private bookmark research also requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in the skill-local `.env`. Validate access by running `scripts/fetch_bookmarks.py`; never inspect the file's values.

### Secret Safety (Mandatory)

- Never read, print, parse, summarize, upload, or send `~/.xurl` (or copies of it) to the LLM context.
- Never read, print, parse, summarize, upload, or send the skill's `.env` file to the LLM context. Access the user's bookmark corpus only through `scripts/fetch_bookmarks.py`.
- Never ask the user to paste credentials/tokens into chat.
- The user must fill `~/.xurl` with required secrets manually on their own machine.
- Do not recommend or execute auth commands with inline secrets in agent/LLM sessions.
- Warn that using CLI secret options in agent sessions can leak credentials (prompt/context, logs, shell history).
- Never use `--verbose` / `-v` in agent/LLM sessions; it can expose sensitive headers/tokens in output.
- Never run `xurl token` in agent/LLM sessions: it prints a live OAuth2 access token to stdout, which is a credential and must not enter the LLM context.
- `xurl mcp` is for configuring an MCP client (it bridges stdio↔HTTP and injects the bearer token); it is not something to invoke directly from an agent/LLM session.
- Sensitive flags that must never be used in agent commands: `--bearer-token`, `--consumer-key`, `--consumer-secret`, `--access-token`, `--token-secret`, `--client-id`, `--client-secret`.
- To verify whether at least one app with credentials is already registered, run: `xurl auth status`.

### External action safety (Mandatory)

- Treat research, search, reading, and listing requests as read-only. Never infer permission to post, reply, quote, DM, like, repost, bookmark, follow, block, mute, or delete.
- Perform a mutating action only when the user explicitly requests that action and the account, target, and content or effect are unambiguous.
- Before retrying any failed create or delete action, read the relevant remote state so a partial success cannot cause a duplicate or unintended reversal.

### Register an app (recommended)

App credential registration must be done manually by the user outside the agent/LLM session.
After credentials are registered, authenticate against the app that holds those credentials:

```bash
xurl auth oauth2 --app APP_NAME
```

You can also run `xurl auth default APP_NAME` first and then use `xurl auth oauth2`.

On a remote/headless machine (no reachable browser callback), add `--headless`: `xurl auth oauth2 --app APP_NAME --headless` prints the authorization URL and reads the pasted redirect URL (or code) back, so no localhost callback is needed.

For multiple pre-configured apps, switch between them:
```bash
xurl auth default prod-app          # set default app
xurl auth default prod-app alice    # set default app + user
xurl --app dev-app /2/users/me      # one-off override
xurl auth apps redirect-uri get prod-app
xurl auth apps redirect-uri set prod-app http://localhost:8080/callback
```

### Other auth methods

Examples with inline secret flags are intentionally omitted. If OAuth1 or app-only auth is needed, the user must run those commands manually outside agent/LLM context.

Tokens are persisted to `~/.xurl` in YAML format. Each app has its own isolated tokens and may also store a `redirect_uri`. `REDIRECT_URI` in the environment still takes precedence over the stored app value. Do not read this file through the agent/LLM. Once authenticated, every command below will auto‑attach the right `Authorization` header.

---

## Quick Reference

| Action | Command |
|---|---|
| Post | `xurl post "Hello world!"` |
| Reply | `xurl reply POST_ID "Nice post!"` |
| Quote | `xurl quote POST_ID "My take"` |
| Delete a post | `xurl delete POST_ID` |
| Read a post | `xurl read POST_ID` |
| Search posts | `xurl search "QUERY" -n 10` |
| Who am I | `xurl whoami` |
| Look up a user | `xurl user @handle` |
| List a user's posts | `xurl posts @handle -n 10` |
| Home timeline | `xurl timeline -n 20` |
| Mentions | `xurl mentions -n 10` |
| Like | `xurl like POST_ID` |
| Unlike | `xurl unlike POST_ID` |
| Repost | `xurl repost POST_ID` |
| Undo repost | `xurl unrepost POST_ID` |
| Bookmark | `xurl bookmark POST_ID` |
| Remove bookmark | `xurl unbookmark POST_ID` |
| List bookmarks | `xurl bookmarks -n 10` |
| List likes | `xurl likes -n 10` |
| Follow | `xurl follow @handle` |
| Unfollow | `xurl unfollow @handle` |
| List following | `xurl following -n 20` |
| List followers | `xurl followers -n 20` |
| Block | `xurl block @handle` |
| Unblock | `xurl unblock @handle` |
| Mute | `xurl mute @handle` |
| Unmute | `xurl unmute @handle` |
| Send DM | `xurl dm @handle "message"` |
| List DMs | `xurl dms -n 10` |
| Upload media | `xurl media upload path/to/file.mp4` |
| Media status | `xurl media status MEDIA_ID` |
| **App Management** | |
| Register app | Manual, outside agent (do not pass secrets via agent) |
| List apps | `xurl auth apps list` |
| Update app config | Manual, outside agent (do not pass secrets via agent) |
| View app redirect URI | `xurl auth apps redirect-uri get [NAME]` |
| Set app redirect URI | `xurl auth apps redirect-uri set NAME URI` |
| Remove app | `xurl auth apps remove NAME` |
| Set default (interactive) | `xurl auth default` |
| Set default (command) | `xurl auth default APP_NAME [USERNAME]` |
| Use app per-request | `xurl --app NAME /2/users/me` |
| Auth status | `xurl auth status` |

> **Post IDs vs URLs:** Anywhere `POST_ID` appears above you can also paste a full post URL (e.g. `https://x.com/user/status/1234567890`) — xurl extracts the ID automatically.

> **Usernames:** Leading `@` is optional. `@elonmusk` and `elonmusk` both work.

---

## Command Details

### Posting

```bash
# Simple post
xurl post "Hello world!"

# Post with media (upload first, then attach)
xurl media upload photo.jpg          # → note the media_id from response
xurl post "Check this out" --media-id MEDIA_ID

# Multiple media
xurl post "Thread pics" --media-id 111 --media-id 222

# Reply to a post (by ID or URL)
xurl reply 1234567890 "Great point!"
xurl reply https://x.com/user/status/1234567890 "Agreed!"

# Reply with media
xurl reply 1234567890 "Look at this" --media-id MEDIA_ID

# Quote a post
xurl quote 1234567890 "Adding my thoughts"

# Delete your own post
xurl delete 1234567890
```

### Reading

```bash
# Read a single post (returns author, text, metrics, entities)
xurl read 1234567890
xurl read https://x.com/user/status/1234567890

# Search recent posts (default 10 results)
xurl search "golang"
xurl search "from:elonmusk" -n 20
xurl search "#buildinpublic lang:en" -n 15

# Search a 30-day window through the paid full archive
# URL-encode QUERY and use an ISO-8601 timestamp for START_TIME.
xurl --auth app '/2/tweets/search/all?query=QUERY&max_results=20&start_time=START_TIME&sort_order=relevancy'
```

Use `xurl search` for the last seven days. Full-archive access was verified on
2026-08-06; prefer `/2/tweets/search/all` with a 30-day window and relevance
sorting for research. If full-archive access fails, fall back to recent search
without blocking the task.

### Practitioner research

Use this workflow when the user wants practical knowledge, comparisons, workflows, or advice rather than a single-post lookup:

1. Form an initial public query from the user's question before inspecting bookmark-derived vocabulary. In parallel, fetch the user's bookmark corpus with `scripts/fetch_bookmarks.py` and retrieve about 20 public posts from the preceding 30 days.
2. Merge and deduplicate candidates by Post ID. Seek first-hand demonstrated practice: concrete methods, constraints, outputs, artefacts, lessons, or failures. Treat engagement as neither relevance nor evidence. Remove marketing, unsupported generalisations, repetition, and merely adjacent material. Let the model judge relevance; do not use a numeric rubric, fixed author roster, mandatory media filter, or result quota.
3. Stop when more searching is unlikely to change the answer. When a named evidence gap remains, run targeted batches of 10–20 public reads, up to 100 public Posts for the default request. For recommendations, include one search aimed at friction, failures, limitations, or contrary experience.
4. Expand replies, self-threads, quote Posts, or linked artefacts only around strong, load-bearing candidates. Count every additional Post returned against the budget.
5. If a material gap remains after the default pass, offer deeper research. State the gap, proposed searches, and estimated cost. After approval, use up to 200 public reads by default; treat $5 as an exceptional ceiling that requires explicit agreement to a broader scope, not a spending target.

At the price verified on 2026-08-06, public Post reads cost $0.005 each: 20 reads cost about $0.10, 100 about $0.50, and 200 about $1. Stop early rather than spending the allowance automatically.

For practitioner research, end with **What might change the user's workflow?** and one or two concrete experiments. Include a compact manifest listing the bookmark count reviewed, public queries, effective time window, public reads, estimated cost, and material evidence gaps. Do not reveal which individual Posts came from the user's private bookmarks unless he asks.

### Visual review for Twitter research

When the task asks to find, compare, collect, survey, or round up multiple posts, create and open a visual review page if embeds materially aid assessment. Use it when the final set contains at least three substantial posts, or when images, videos, quotes, or reply context matter. Skip it for a single-post lookup, a quick factual answer, or research that does not benefit from visual comparison.

1. Curate before rendering. Include only Posts that earn their place; do not pad the page to reach a target count.
2. Archive the lightweight report data under `<project-root>/research/xurl/YYYY-MM-DD-<short-slug>/` by default. The archive must contain:
   - `research.js`: the completed report data used by the visual template.
   - `manifest.md`: the original question, date, public queries, effective time window, public Post reads, estimated cost, and material evidence gaps.
   Do not archive raw API responses, the bookmark corpus, private-source provenance, `node_modules/`, or build output. Use another persistent location only when the user requests one.
3. Copy `assets/twitter-research-page/` to `/tmp/xurl-research-<short-slug>/` as the disposable rendering environment.
4. Replace every placeholder in `src/research.js`: date, research title, concise synthesis, optional repeated-workflow labels, a lead post when one deserves emphasis, the selected post IDs, author labels, section labels, and the selection note. Copy the completed file to the archive as `research.js` and write `manifest.md` before rendering.
5. Use the bundled `react-tweet` component. Do not replace embeds with screenshots, hand-written tweet cards, or quoted text.
6. Run `yarn install --immutable`, `yarn build`, then `yarn preview --host 127.0.0.1 --port <available-port>`. Verify that every embed loads and check desktop and mobile screenshots with Playwright. The persistent "Open on X" link is the fallback for an unavailable embed.
7. Open the page in the user's browser before the final response. Keep the final written synthesis concise and include both the local page URL and the persistent archive path.

Treat the page as a review surface, not a raw search dump. React Tweet sends each selected public post ID to `react-tweet.vercel.app` and loads media from X, so do not use it for sensitive or non-public material. Only identify posts as coming from the user's private likes or bookmarks when the user asks for that provenance. The rendering environment is temporary; the lightweight archive is persistent by default.

### User Info

```bash
# Your own profile
xurl whoami

# Look up any user
xurl user elonmusk
xurl user @XDevelopers

# List a user's recent posts (by @username)
xurl posts elonmusk
xurl posts @XDevelopers -n 25
```

### Timelines & Mentions

```bash
# Home timeline (reverse chronological)
xurl timeline
xurl timeline -n 25

# Your mentions
xurl mentions
xurl mentions -n 20
```

### Engagement

```bash
# Like / unlike
xurl like 1234567890
xurl unlike 1234567890

# Repost / undo
xurl repost 1234567890
xurl unrepost 1234567890

# Bookmark / remove
xurl bookmark 1234567890
xurl unbookmark 1234567890

# List your bookmarks / likes
xurl bookmarks -n 20
xurl likes -n 20
```

### Social Graph

```bash
# Follow / unfollow
xurl follow @XDevelopers
xurl unfollow @XDevelopers

# List who you follow / your followers
xurl following -n 50
xurl followers -n 50

# List another user's following/followers
xurl following --of elonmusk -n 20
xurl followers --of elonmusk -n 20

# Block / unblock
xurl block @spammer
xurl unblock @spammer

# Mute / unmute
xurl mute @annoying
xurl unmute @annoying
```

### Direct Messages

```bash
# Send a DM
xurl dm @someuser "Hey, saw your post!"

# List recent DM events
xurl dms
xurl dms -n 25
```

### Media Upload

```bash
# Upload a file (auto‑detects type for images/videos)
xurl media upload photo.jpg
xurl media upload video.mp4

# Specify type and category explicitly
xurl media upload --media-type image/jpeg --category tweet_image photo.jpg

# Check processing status (videos need server‑side processing)
xurl media status MEDIA_ID
xurl media status --wait MEDIA_ID    # poll until done

# Full workflow: upload then post
xurl media upload meme.png           # response includes media id
xurl post "lol" --media-id MEDIA_ID
```

---

## Global Flags

These flags work on every command:

| Flag | Short | Description |
|---|---|---|
| `--app` | | Use a specific registered app for this request (overrides default) |
| `--auth` | | Force auth type: `oauth1`, `oauth2`, or `app` |
| `--username` | `-u` | Which OAuth2 account to use (if you have multiple) |
| `--verbose` | `-v` | Forbidden in agent/LLM sessions (can leak auth headers/tokens) |

---

## Raw API Access

The shortcut commands cover the most common operations. For anything else, use xurl's raw curl‑style mode — it works with **any** X API v2 endpoint:

```bash
# GET request (default)
xurl /2/users/me

# POST with JSON body
xurl -X POST /2/tweets -d '{"text":"Hello world!"}'

# PUT, PATCH, DELETE
xurl -X DELETE /2/tweets/1234567890

# Custom headers
xurl -H "Content-Type: application/json" /2/some/endpoint

# Force streaming mode
xurl -s /2/tweets/search/stream

# Full URLs also work
xurl https://api.x.com/2/users/me
```

---

## Streaming

Streaming endpoints are auto‑detected. Known streaming endpoints include:
- `/2/tweets/search/stream`
- `/2/tweets/sample/stream`
- `/2/tweets/sample10/stream`

You can force streaming on any endpoint with `-s`:
```bash
xurl -s /2/some/endpoint
```

---

## Output Format

All commands return **JSON** to stdout, pretty‑printed with syntax highlighting. The output structure matches the X API v2 response format. A typical response looks like:

```json
{
  "data": {
    "id": "1234567890",
    "text": "Hello world!"
  }
}
```

Errors are also returned as JSON:
```json
{
  "errors": [
    {
      "message": "Not authorized",
      "code": 403
    }
  ]
}
```

---

## Common Workflows

### Post with an image
```bash
# 1. Upload the image
xurl media upload photo.jpg
# 2. Copy the media_id from the response, then post
xurl post "Check out this photo!" --media-id MEDIA_ID
```

### Reply to a conversation
```bash
# 1. Read the post to understand context
xurl read https://x.com/user/status/1234567890
# 2. Reply
xurl reply 1234567890 "Here are my thoughts..."
```

### Search and engage
```bash
# 1. Search for relevant posts
xurl search "topic of interest" -n 10
# 2. Like an interesting one
xurl like POST_ID_FROM_RESULTS
# 3. Reply to it
xurl reply POST_ID_FROM_RESULTS "Great point!"
```

### Check your activity
```bash
# See who you are
xurl whoami
# Check your mentions
xurl mentions -n 20
# Check your timeline
xurl timeline -n 20
```

### Set up multiple apps
```bash
# App credentials must already be configured manually outside agent/LLM context.
# Authenticate users on each pre-configured app
xurl auth default prod
xurl auth oauth2                       # authenticates on prod app

xurl auth default staging
xurl auth oauth2                       # authenticates on staging app

# Switch between them
xurl auth default prod alice           # prod app, alice user
xurl --app staging /2/users/me         # one-off request against staging
```

---

## Error Handling

- Non‑zero exit code on any error.
- API errors are printed as JSON to stdout (so you can still parse them).
- Auth errors suggest re‑running `xurl auth oauth2` or checking your tokens.
- If a command requires your user ID (like, repost, bookmark, follow, etc.), xurl will automatically fetch it via `/2/users/me`. When that endpoint is unreliable, use `--username USERNAME` or authenticate with `xurl auth oauth2 --app APP_NAME USERNAME` so xurl can fall back to username lookup.
- If X returns `client-forbidden` / `client-not-enrolled` after successful auth, check the app’s X developer-console package and environment. In current testing, moving the app to `Pay-per-use` and `Production` fixed `/2/*` read failures without changing local `xurl` auth data.

---

## Notes

- **Paid reads:** Search is billed per Post returned. The practitioner-research workflow defines the workflow's default budgets. Before exceeding them, check the current X Developer Console unit price and spending limit, then estimate the maximum charge.
- **Rate limits:** The X API enforces rate limits per endpoint. If you get a 429 error, wait and retry. Write endpoints (post, reply, like, repost) have stricter limits than read endpoints.
- **Scopes:** OAuth 2.0 tokens are requested with broad scopes. If you get a 403 on a specific action, your token may lack the required scope — re‑run `xurl auth oauth2` to get a fresh token.
- **Token refresh:** OAuth 2.0 tokens auto‑refresh when expired. No manual intervention needed.
- **Multiple apps:** Each app has its own isolated credentials, tokens, and optional stored `redirect_uri`. Configure credentials manually outside agent/LLM context, then switch with `xurl auth default` or `--app`.
- **Redirect URI precedence:** The effective redirect URI resolves from `REDIRECT_URI` in the environment first, then the app's stored `redirect_uri` in `~/.xurl`, then the built-in default.
- **Redirect URI management:** Use `xurl auth apps redirect-uri get [NAME]`, `xurl auth apps redirect-uri set NAME URI`, or `xurl auth apps update NAME --redirect-uri URI` to inspect and manage the stored per-app callback value.
- **X platform enrollment:** A successful OAuth callback does not guarantee `/2/*` reads will work. If you see `client-not-enrolled`, verify the app is in the correct X package/environment. Current confirmed fix: `Apps` -> `Manage apps` -> `Move to package` -> choose `Pay-per-use`, then move the app to `Production`.
- **Multiple accounts:** You can authenticate multiple OAuth 2.0 accounts per app and switch between them with `--username` / `-u` or set a default with `xurl auth default APP USER`.
- **Default user:** When no `-u` flag is given, xurl uses the default user for the active app (set via `xurl auth default`). If no default user is set, it uses the first available token.
- **Token storage:** `~/.xurl` is YAML. Each app stores its own credentials and tokens. Never read or send this file to LLM context.
- **Access tokens:** `xurl token` prints a valid (refreshed) OAuth2 access token for the active app to stdout, refreshing and persisting it if expired. It never opens a browser. The output is a secret — use it only in the user's own scripts, never in agent/LLM sessions.
- **MCP bridge:** `xurl mcp [URL]` bridges a stdio MCP client to a remote Streamable HTTP MCP server (default `https://api.x.com/mcp`), injecting `Authorization: Bearer <token>` and refreshing the token automatically. On first run with no cached token it opens the browser for a one-time OAuth2 login using the `CLIENT_ID`/`CLIENT_SECRET` from its environment (the handshake waits for it, so set a generous `startup_timeout_sec`); on a headless host, authenticate out-of-band first with `xurl auth oauth2 --headless`. Configure it in an MCP client via the npm launcher: `{"command":"npx","args":["-y","@xdevplatform/xurl","mcp","https://api.x.com/mcp"],"env":{"CLIENT_ID":"...","CLIENT_SECRET":"..."},"startup_timeout_sec":300}`.
