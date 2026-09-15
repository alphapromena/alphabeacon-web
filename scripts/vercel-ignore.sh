#!/usr/bin/env bash
# Vercel's Ignored Build Step (vercel.json "ignoreCommand"): exit 0 skips the
# build, non-zero builds. TEST-0915-2, D-TEST-0915-2-A.
#
# The base is the LAST SUCCESSFUL DEPLOYMENT, which Vercel exposes here as
# VERCEL_GIT_PREVIOUS_SHA, with HEAD^ only when it is unset. Diffing HEAD^
# alone (ae2d741) read a push whose last commit is docs-only as docs-only and
# canceled it while the code commits beneath never deployed — every merge in
# this project ends on a close-out docs commit.
#
# A base that does not resolve to a commit object in the clone — a shallow
# clone that lacks it, a first push — BUILDS. `git rev-parse --verify` on a
# bare 40-hex SHA answers 0 whether or not the object exists, hence ^{commit}.
#
# Lives in a file because vercel.json caps ignoreCommand at 256 characters.
# The exclusion list is exactly the one ae2d741 landed: the ledgers, the docs,
# and the four root markdown files, none of which is served or imported.
base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git rev-parse --verify --quiet "$base^{commit}" >/dev/null || exit 1
git diff --quiet "$base" HEAD -- . \
  ':(exclude).agent' \
  ':(exclude)Docs' \
  ':(exclude)CLAUDE.md' \
  ':(exclude)design.md' \
  ':(exclude)screens4.md' \
  ':(exclude)web-plan.md' \
  && exit 0 || exit 1
