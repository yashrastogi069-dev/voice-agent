# GitHub Update Workflow

This repository is the source-controlled record for the India Voice Agent application. Changes should be made and verified in the managed project first, then pushed only after a successful TypeScript check and automated test run.

## Standard Update Sequence

Run the following commands from the repository root after a completed feature or bug fix.

```bash
pnpm check
pnpm test
git status
git add <reviewed-files>
git commit -m "<concise description of the completed change>"
git push origin main
```

Use focused commits that describe a finished unit of work, such as `Add LiveKit SIP preflight controls` or `Harden college fact retrieval`. Do not commit unfinished experiments, generated build output, local logs, provider credentials, `.env` files, recordings, or personal contact exports.

## Required Review Before Push

Confirm that the change has passed `pnpm check` and `pnpm test`, then review `git status` and `git diff --staged`. In particular, keep LiveKit, Exotel, n8n, Deepgram, and other provider credentials in managed environment settings rather than repository files. Real student contact data and call recordings must also remain out of version control.

## Release Milestones

For material changes, save a managed project checkpoint before the GitHub push. The checkpoint provides a restorable deployment state; the GitHub commit provides an auditable source-code history. Push completed changes to `main` unless a feature branch is deliberately created for a larger review.
