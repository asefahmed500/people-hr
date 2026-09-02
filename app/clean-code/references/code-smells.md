# Code Smells

A catalog of recognizable patterns that usually — not always — indicate an underlying design problem worth addressing. Each is a signal to investigate, not an automatic violation; use judgment about whether the specific instance actually warrants a change.

## Long method / long function
A function that's grown to handle many steps/responsibilities, making it hard to hold the whole purpose in mind at once. **Fix**: extract cohesive sub-steps into their own well-named functions (see `functions-and-structure.md`) — often the length itself resolves as a side effect of properly separating responsibilities, rather than being something to fix directly by arbitrarily splitting at a line-count threshold.

## God object / god class
A single class/module that's accumulated a large number of loosely-related responsibilities over time — often the result of repeatedly adding "just one more thing" to a convenient existing class rather than creating a new, more focused one. Recognizable by: a very large number of methods/fields, methods that don't have much to do with each other conceptually, and the class being imported/depended-on by a large fraction of the codebase. **Fix**: identify the distinct responsibilities actually present and split into separate, focused classes/modules, each with a clear single concept.

## Feature envy
A method that spends most of its logic operating on another object's data (calling many getters on another object, doing calculations based on its fields) rather than its own — a sign the logic might belong on the other object instead. **Fix**: consider moving the method (or the relevant portion of its logic) to the class/module whose data it's actually working with.

## Primitive obsession
Using primitive types (strings, numbers, raw booleans) to represent concepts that actually have their own rules/meaning/validity constraints — e.g. representing money as a raw float, an email as a plain string with validation scattered wherever it's used, a status as a raw string compared against magic string literals in many places. **Fix**: introduce a small dedicated type/class (a `Money` type with its own arithmetic that avoids float precision issues, an `Email` type that validates on construction, an enum for status) so the rules live in one place and the type system itself prevents some classes of misuse (e.g. can't accidentally pass an arbitrary string where a validated `Email` is expected).

## Shotgun surgery
A single logical change requires making small edits across many different files/functions/classes — a sign that a concept that should be centralized is instead scattered. **Fix**: consolidate the scattered logic into one place (often related to fixing genuine duplication — see `duplication-and-abstraction.md`) so future changes to that concept touch one location, not many.

## Magic numbers and magic strings
A literal value embedded directly in logic with no explanation of what it means or why that specific value — `if (daysSinceSignup > 14)`, `if (status === "3")`. **Fix**: extract to a named constant (`const TRIAL_PERIOD_DAYS = 14`) that documents the meaning directly in its name, and centralizes the value if it's used in more than one place.

## Deep nesting / arrow code
Conditionals nested many levels deep, burying the core logic and making the various branches hard to trace. **Fix**: guard clauses/early returns (see `functions-and-structure.md`), or extracting the nested block into its own function.

## Long parameter lists
A function requiring many positional parameters, making call sites hard to read (what does the fourth `true` argument mean?) and the function itself harder to call correctly. **Fix**: group related parameters into an object/struct, or reconsider whether the function is doing too much (a very long parameter list sometimes indicates the function has too many responsibilities, each needing its own inputs).

## Dead code
Code that's no longer called/reachable/used — commented-out old implementations, unused functions/variables, feature-flagged code where the flag is permanently in one state now. **Fix**: delete it. Version control preserves history if it's ever needed again — dead code left in place adds reading/maintenance burden and creates false signals about what's actually in use, and commented-out code in particular tends to rot (becoming subtly incorrect/outdated) since nobody maintains it.

## Speculative generality
Abstraction, configuration options, or extension points built for a flexibility need that doesn't actually exist yet ("we might need to support other payment providers someday" leading to a fully pluggable payment-provider abstraction for a system that only ever has one provider) — adds real complexity for a hypothetical future need that may never materialize, and even if it does, the actual future requirements are often different enough from the speculative guess that the abstraction needs rework anyway. **Fix**: build for the actual current requirement; add the abstraction when a second real, concrete case shows up (echoes the "rule of three" from `duplication-and-abstraction.md`).

## Inconsistent abstraction levels within one function
A function that mixes high-level orchestration ("process the order") with low-level implementation detail (specific string manipulation, specific arithmetic) in the same body, forcing the reader to context-switch between levels of detail while reading top to bottom. **Fix**: extract the low-level detail into well-named helper functions so the higher-level function reads as a clear sequence of named steps, each at a consistent level of abstraction.

## Temporal coupling
Functions/methods that must be called in a specific order for correctness, where that ordering requirement isn't visible from the function signatures themselves (e.g. `initialize()` must be called before `process()`, but nothing enforces or documents this beyond a comment, if that). **Fix**: where possible, make the dependency explicit in the type/API design (e.g. `process()` requires the result of `initialize()` as an explicit parameter, so it's structurally impossible to call out of order) rather than relying on callers remembering an implicit convention.