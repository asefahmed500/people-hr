---
name: clean-code
description: >-
  Use this skill whenever writing, reviewing, or refactoring code in any language, with a focus on readability, maintainability, and correctness of logic — not a specific framework's conventions. Trigger for "write this cleanly", "clean up this code", "review my code for quality", "refactor this", "make this more readable/maintainable", "this function is too complex", "how should I name/structure this", "handle all the edge cases", naming questions, function/module structure, error handling design, code smells, or general code review not specific to a particular framework. Apply proactively to any non-trivial code Claude generates, even without an explicit ask. Do NOT use in place of a more precisely relevant skill (react-nextjs-best-practices, database-design, security-review) — use those for their specific domain and this skill for underlying code-quality principles that apply regardless of language.
---

# Clean Code

Language-agnostic principles for writing code that's correct, readable, and doesn't accumulate the kind of complexity that makes future changes risky. Apply while writing, not only when explicitly asked to review — clean code is meaningfully cheaper to produce upfront than to retrofit later.

## Core principle: code is read far more than it's written

Optimize for the person (often a future version of the same author) who has to read, understand, and safely modify this code later — not for the fewest keystrokes now or for showing off language cleverness. When a clearer-but-slightly-longer version and a terser-but-denser version are both correct, prefer the clearer one. This single principle underlies nearly every guideline below.

## Workflow

### Step 1: Get the logic right and complete, before polishing style
Before naming/formatting concerns, verify the logic actually handles what it needs to:
- **Enumerate the cases**: the happy path, plus every edge case (empty input, null/undefined, zero, negative numbers, single-element vs. many-element collections, duplicate values, boundary values at the edge of a valid range, concurrent/repeated calls if relevant). Write out what should happen for each before or while writing the implementation — code that only handles the case the author was thinking about when they wrote it is a common, serious source of production bugs.
- **Trace failure paths, not just success paths**: what happens when a dependency call fails, a file doesn't exist, a network request times out, input is malformed? Silent failure (swallowing an exception and continuing as if nothing happened) is rarely correct — see `references/error-handling.md`.
- **Check the boundaries explicitly**: off-by-one errors, inclusive vs. exclusive ranges, empty collections vs. single-item collections behaving differently than expected — these are disproportionately common bug sources relative to how simple they sound, precisely because they're easy to overlook when focused on the main logic.

### Step 2: Name things so the code explains itself
See `references/naming-and-readability.md` for the detailed guidance. The short version: a name should tell the reader what a thing *is* or *does* without needing to read its implementation — `daysUntilExpiry` over `d`, `hasActiveSubscription()` over a bare boolean check the reader has to parse, `filterActiveUsers` over `filter1`. Good naming is one of the highest-leverage, lowest-cost investments in readability available.

### Step 3: Structure functions/methods for a single, clear responsibility
A function should do one coherent thing at one level of abstraction — see `references/functions-and-structure.md` for function length/complexity guidance, the single-responsibility principle applied practically, parameter design, and avoiding deep nesting. A function that's hard to name concisely and accurately is often a function that's doing more than one thing.

### Step 4: Handle errors deliberately, not as an afterthought
Decide explicitly, for each failure-prone operation: should this fail loudly (raise/throw, so the caller can't accidentally ignore it), fail with a typed/specific error the caller can meaningfully handle, or is there a genuine, correct fallback/default? See `references/error-handling.md` for the full guidance — including why silently swallowing exceptions and returning ambiguous sentinel values (like `-1` or `null` for "not found" mixed with `null` for "error") are both common sources of bugs that are hard to trace later.

### Step 5: Eliminate duplication — deliberately, not reflexively
Repeated logic (not just repeated text, but repeated *decisions*) should usually be consolidated into one place, so a future change/fix only needs to happen once. But see `references/duplication-and-abstraction.md` for the important caveat: premature or forced abstraction to avoid superficial duplication that isn't actually the same underlying concept creates its own maintenance cost (a shared abstraction now serving two things that later need to diverge) — duplication that represents genuinely different concerns that happen to look similar today is often better left separate.

### Step 6: Check for and remove code smells
See `references/code-smells.md` for a catalog (long functions/classes, deep nesting, primitive obsession, feature envy, shotgun surgery, god objects/functions, magic numbers/strings, dead code) with what each one signals and how to address it.

### Step 7: Comment the why, not the what
Code should be self-explanatory about *what* it does through naming and structure (Steps 2-3); comments earn their place explaining *why* — a non-obvious business rule, a workaround for a specific bug/limitation, a deliberate trade-off that isn't visible from the code alone. A comment restating what the next line of code obviously does is noise; a comment explaining why a seemingly-odd approach was chosen is valuable. See `references/comments-and-documentation.md`.

### Step 8: Make the code testable, and consider what needs a test
Code that's hard to test (tightly coupled to global state, hidden dependencies, side effects mixed with logic) is usually also code that's hard to reason about and change safely — testability and clean structure are closely linked, not separate concerns. See `references/testability-and-tests.md` for dependency injection basics, separating pure logic from side effects, and what's actually worth testing (the cases enumerated in Step 1 — edge cases and failure paths, not just the happy path).

### Step 9: Deliver the code
Write the actual code following these practices by default for any non-trivial code generated — don't wait to be asked to "clean it up" separately. For an explicit review of existing code, point at specific lines/functions with the concrete issue and fix, organized by what matters most (correctness/logic issues first, then structure, then naming/style) rather than a flat undifferentiated list.

## Common anti-patterns to flag

- **Only handling the happy path** — no consideration of empty/null/boundary/error cases (see Step 1).
- **Deeply nested conditionals** (arrow-code / "pyramid of doom") instead of early returns/guard clauses that keep the main logic at a shallow, readable nesting level.
- **Functions doing multiple unrelated things** — fetching data, transforming it, and rendering/side-effecting all in one function, making it hard to test or reuse any one part independently.
- **Magic numbers/strings** with no named constant explaining what they mean or why that specific value.
- **Misleading or vague names** (`data`, `temp`, `flag`, `handleClick2`) that force the reader to trace usage to understand what something actually is.
- **Swallowed exceptions** (`catch (e) {}` or equivalent) that hide failures instead of handling or propagating them.
- **Copy-pasted blocks** with only minor variations, instead of a parameterized shared function — though see Step 5's caveat about not force-abstracting genuinely different concerns.
- **Comments that restate the code** ("// increment i by 1" above `i++`) instead of explaining non-obvious intent, or comments that have drifted out of sync with the code they describe.
- **Boolean parameter soup** (`createUser(true, false, true, null)`) where the meaning of each argument isn't clear at the call site — prefer named parameters/options objects where the language supports them.
- **Global mutable state** modified from many places, making behavior hard to trace and testing hard to isolate.

## Reference files

- `references/naming-and-readability.md` — naming conventions, self-documenting code, readability heuristics
- `references/functions-and-structure.md` — function length/complexity, single responsibility, parameter design, nesting/guard clauses
- `references/error-handling.md` — when to throw vs. handle vs. propagate, avoiding silent failures, error types vs. sentinel values
- `references/duplication-and-abstraction.md` — DRY applied correctly, when NOT to abstract, the "rule of three"
- `references/code-smells.md` — catalog of smells (long methods, god objects, feature envy, primitive obsession, shotgun surgery, dead code) and fixes
- `references/comments-and-documentation.md` — what's worth commenting, docstrings/API documentation, keeping comments accurate over time
- `references/testability-and-tests.md` — writing testable code, dependency injection basics, what's actually worth testing

Read the relevant reference file(s) at the corresponding workflow step rather than all upfront — each is self-contained.