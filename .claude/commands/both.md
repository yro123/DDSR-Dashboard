---
description: Ask both Grok and Codex the same question and compare
---
1. Run `grok -p "$ARGUMENTS"` — capture output.
2. Run `codex exec --skip-git-repo-check "$ARGUMENTS"` — capture output.
3. Compare side-by-side: where they agree, where they diverge, which is stronger and why.
4. Synthesize a recommended answer.
