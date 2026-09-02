# Naming & Readability

Good naming is the highest-leverage, lowest-cost investment in code readability — a well-named piece of code needs fewer comments and is faster to understand correctly on first read.

## What a good name does
A name should let the reader understand what a thing is or does *without* needing to read its implementation or trace its usage elsewhere. `getUser(id)` tells you what it does; `process(id)` doesn't. `isEligibleForDiscount` tells you what a boolean means; `flag` doesn't.

## Naming guidelines

- **Be specific, not generic**: `activeUserCount` over `count`, `filteredOrders` over `data`, `retryDelayMs` over `delay` (bonus: the unit is in the name, avoiding a whole class of unit-confusion bugs — see below).
- **Booleans should read as a yes/no question or state**: `isValid`, `hasPermission`, `canEdit`, `wasSuccessful` — not `valid` (ambiguous: is this a boolean, or the valid item itself?) or `check` (says nothing about what's being checked or what true/false means).
- **Functions/methods should be named for what they do, using a verb**: `calculateTotal()`, `sendNotification()`, `validateInput()` — not noun-only names that don't convey action (`total()` on its own is ambiguous between "calculate the total" and "return a stored total field").
- **Avoid abbreviations that aren't universally understood**: `userCount` over `usrCnt`, `configuration` over `cfg` in most contexts — the few keystrokes saved cost every future reader a moment of decoding. Widely-understood abbreviations in context (`id`, `url`, `html`, loop counters `i`/`j` in a genuinely short, obvious loop) are fine; ambiguous or project-specific abbreviations aren't.
- **Encode units and important qualifiers in the name** when they're not otherwise obvious from the type: `timeoutMs` vs. `timeoutSeconds` (not just `timeout`), `priceInCents` vs. `priceInDollars` — this single practice prevents a real, recurring class of bugs (mismatched unit assumptions between caller and callee).
- **Use consistent vocabulary for the same concept across the codebase**: don't call the same thing `user`, `customer`, and `account` interchangeably in different files/functions if they refer to the same entity — pick one term and use it consistently, since inconsistent terminology makes readers wonder whether it's actually a different, distinct concept each time.
- **Avoid names that lie or mislead**: a function named `getUser` that also has side effects (writes to a database, sends an event) is misleading — either rename it to reflect what it actually does (`fetchAndLogUser`), or (usually better) separate the read and the side effect into different functions so each name stays accurate.
- **Class/type names are nouns; function/method names are verbs (or verb phrases)**: `OrderProcessor` (a thing), `processOrder()` (an action) — mixing these up (a class named `ProcessOrder`, a function named `orderProcessor`) is a small but real readability friction.

## Scope and name length trade-off
Shorter names are acceptable — even preferable — for very short-lived, narrow-scope variables where context makes the meaning obvious (a loop index `i` in a five-line loop, a lambda parameter `x` in a one-line map). Longer, more descriptive names earn their length for anything with broader scope or longer lifetime (a function parameter, a class field, a module-level constant) where the reader encountering it doesn't have the immediately-surrounding context to infer meaning from brevity alone. Matching name length/specificity to scope is itself a readability signal — an unusually terse name in a broad-scope context, or an unusually verbose name in a two-line lambda, both slow the reader down slightly by breaking the expected pattern.

## Self-documenting code as the goal
The best comment is often the one that becomes unnecessary because the code itself is clear enough not to need it — extracting a well-named function or variable for a non-obvious expression is frequently a better fix than commenting the expression:

```
// Less clear — needs a comment to explain the condition
if (user.age >= 18 && user.verifiedEmail && !user.suspended) { ... } // eligible to purchase

// Clearer — the condition explains itself
const isEligibleToPurchase = user.age >= 18 && user.verifiedEmail && !user.suspended;
if (isEligibleToPurchase) { ... }
```
This isn't a rule to extract a named variable for every expression (that can over-fragment simple code) — it's a heuristic for expressions complex or non-obvious enough that a reader would otherwise pause to parse them.

## Formatting and structure readability
- **Consistent formatting** (indentation, brace style, spacing) — ideally enforced automatically (a formatter/linter) rather than manually maintained, so it's never a distraction or a point of debate in review.
- **Group related code together, separate unrelated code with whitespace** — a function with several distinct "paragraphs" of logic often benefits from blank lines between them (or, if the paragraphs are substantial, extraction into named helper functions per Step 3 of the main workflow).
- **Order code so it reads top-to-bottom in a natural sequence** where possible (e.g. the main flow of a function before its helper functions, in languages/conventions where that ordering is idiomatic) rather than requiring the reader to jump around to reconstruct the sequence of execution.