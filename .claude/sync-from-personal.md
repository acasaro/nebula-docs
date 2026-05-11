# Sync personal repo → enterprise repo

How to copy changes from the public personal GitHub repo (where dev happens off the corporate network) onto the enterprise GitHub repo, landing as a single commit authored by the work git user — as if the diff had been pasted by hand.

## When to use this

You did a stretch of work on the personal Mac in the public mirror of this repo. The enterprise repo is on `uhc-tech/nebula-docs-platform` (framework) or `uhg-internal/mcoe-docs` (tenant zero) and is reachable only from the work machine. You want one clean commit on enterprise `main` containing all the file changes, authored by your work git user.

Pre-conditions:

- The enterprise repo's current `main` matches what the personal repo's `main` was **before** the stretch of work you want to bring over. (If they've drifted independently, use the diff/apply fallback below.)
- The work machine's git user identity is already configured (`user.email`, `user.name`) — the commit picks up whoever's configured locally.
- `.env` and anything else in `.gitignore` is untracked and will survive untouched.

## Why not `git merge --squash`?

The two repos have no shared commits, so plain `git merge` errors out with `refusing to merge unrelated histories`. Adding `--allow-unrelated-histories` makes the merge proceed but conflicts every file that differs, because there's no common base to 3-way-merge against. Painful.

## The procedure

### One-shot (use this if nothing's drifted)

```bash
./utils/sync-from-personal.sh "your commit message"
```

The script lands you on `main`, pulls, sets up the `personal` remote (idempotent), fetches, runs `git read-tree --reset -u personal/main`, shows the staged diff, prompts for confirmation, then commits + pushes + cleans up. Aborts cleanly if the working tree is dirty.

### Manual (when you want to inspect every step)

On the **work machine**, in the enterprise repo clone:

```bash
# 1. Land on a clean main
git checkout main
git pull origin main

# 2. Add personal as a temp remote, fetch
git remote add personal https://github.com/acasaro/nebula-docs.git
git fetch personal main

# 3. Swap working tree + index to exactly match personal/main.
#    HEAD stays on enterprise main, so the next commit lands there.
git read-tree --reset -u personal/main

# 4. Review before committing
git status
git diff --cached     # optional, can be large

# 5. Commit + push (work git user becomes the author)
git commit -m "your message here"
git push origin main

# 6. Cleanup
git remote remove personal
```

The personal repo URL `https://github.com/acasaro/nebula-docs.git` is fixed — that's the public mirror of this framework monorepo and won't change.

## What `read-tree --reset -u` does

- Replaces the index with `personal/main`'s tree.
- Updates the working tree to match (`-u`).
- Leaves `HEAD` pointing at enterprise `main`, so the next commit is a normal commit on enterprise `main` (no merge metadata, no extra parent).
- Does **not** touch untracked files — `.env` and anything gitignored is safe.
- **Will delete** any tracked file that exists on enterprise but not on personal. Scan `git status` for unexpected deletions before committing. If something important is being wiped, abort with `git read-tree --reset -u HEAD` and switch to the fallback.

## Fallback: diff + apply

Use this when enterprise has drifted from personal and you want a reviewable patch before applying:

```bash
git remote add personal https://github.com/acasaro/nebula-docs.git
git fetch personal main

git diff HEAD..personal/main > /tmp/sync.patch    # review this file before applying
git apply --index --3way /tmp/sync.patch          # stages all changes

git status
git commit -m "..."
git push origin main

git remote remove personal
rm /tmp/sync.patch
```

If `git apply` fails on hunks, the failure points tell you which files need manual reconciliation — easier to handle than a blanket overwrite gone wrong.

## After pushing

The personal repo and enterprise repo now have the same file content but unrelated histories. Repeat this procedure each time you finish a stretch of work on the personal side — there's no permanent link between the two, only point-in-time syncs.
