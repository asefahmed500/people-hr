# Comments & Documentation

## Comment the why, not the what
Code should be self-explanatory about *what* it does, primarily through good naming and structure (see `naming-and-readability.md` and `functions-and-structure.md`) — a comment's highest-value job is explaining something the code itself can't convey: *why* a particular approach was taken, especially when it looks surprising or suboptimal without that context.

```
// Low-value comment — just restates the code
// increment the retry counter
retryCount++;

// High-value comment — explains non-obvious "why"
// Cap retries at 3: the payment provider's docs warn that repeated retries
// beyond this can trigger their fraud-detection rate limiting.
if (retryCount < 3) { ... }
```

## What's worth commenting
- **Non-obvious business rules**: a specific threshold, a specific rule that comes from a business/legal/domain requirement that isn't derivable from the code alone (e.g. "orders under $10 skip fraud review — approved by [team/policy], see [ticket]").
- **Workarounds for specific bugs/limitations**: "Using X instead of the more natural Y because of a known issue in [library] version Z (see [issue link]) — revisit when upgraded."
- **Deliberate trade-offs that aren't visible from the code**: why a simpler-looking alternative wasn't chosen, if that context would otherwise be lost and a future reader might "simplify" it back into the problem it was written to avoid.
- **Genuinely complex algorithms** where even well-named steps don't fully convey the underlying approach/reasoning (a reference to the algorithm's name or source, e.g. "// Dijkstra's algorithm, see [reference]" — pointing to authoritative context rather than re-deriving it inline).
- **Public API documentation** (docstrings/doc comments on public functions/classes/modules) — see below.

## What's usually not worth commenting
- Anything the code already says clearly through good naming — a comment restating `// set x to 5` above `x = 5` adds reading burden with no information gain.
- Comments explaining *what* a well-named function does, when the name and a glance at the signature already convey it — reserve doc comments for genuinely non-obvious behavior, parameters, or return values (see docstring guidance below), not to restate the obvious.
- Commented-out old code "just in case" — this is dead code (see `code-smells.md`), not documentation; delete it and rely on version control history if it's ever needed again.

## Docstrings / API documentation
For public functions, classes, and modules — anything meant to be used by other code that isn't right next to it (a library's public API, a module's exported interface) — a doc comment describing purpose, parameters, return value, and any exceptions/errors thrown is genuinely valuable, since the reader at the call site often can't or won't read the implementation before using it. Follow the language/ecosystem's standard doc-comment convention (JSDoc, docstrings/Sphinx-style, Javadoc, etc.) so tooling (IDE hints, generated documentation) picks it up correctly.

For private/internal functions only used nearby within the same file/module, a doc comment is often unnecessary overhead if the function is well-named and its usage is immediately visible to any reader — apply judgment based on how far from its usage a reader might encounter it, not a blanket "every function needs a docstring" rule.

## Keeping comments accurate over time
A comment that's fallen out of sync with the code it describes (because the code was changed and the comment wasn't updated alongside it) is often worse than no comment at all — it actively misleads a reader into believing something false about the code's behavior. When changing code that has an explanatory comment nearby, update or remove the comment as part of the same change — treat stale comments as a bug, not a minor omission. This is part of why "comment the why, not the what" matters practically, not just stylistically: a why-comment (a fixed piece of historical/business context) is far less likely to go stale than a what-comment (which has to be kept in lockstep with every detail of the implementation it's describing).

## TODO comments
Use sparingly and make them actionable — a `TODO` with no context ("// TODO: fix this") is nearly as unhelpful as no comment, since a future reader (including the original author, later) has no idea what "this" refers to or what "fix" would mean. A useful TODO names the specific issue and, ideally, links to a tracked ticket/issue for follow-up: `// TODO(username): remove this fallback once [service] finishes migrating to v2 API — see TICKET-1234`. TODOs that sit unaddressed indefinitely without a tracked follow-up tend to become permanent, silently-stale fixtures — if something is genuinely important enough to leave a TODO, it's usually worth also creating a tracked issue for it.