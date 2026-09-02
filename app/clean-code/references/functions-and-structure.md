# Functions & Structure

## Single responsibility, applied practically
A function should do one coherent thing, at one level of abstraction. A practical test: can you name it accurately with a single clear verb phrase (`validateAndSaveOrder` is a signal it's doing two things — consider splitting into `validateOrder` and `saveOrder`)? Does the function mix high-level orchestration ("process the order") with low-level detail (specific string parsing, specific arithmetic) in the same body? Mixing levels of abstraction within one function is a common, subtle readability cost even when each individual line is simple.

## Function length as a signal, not a hard rule
There's no universally correct line-count limit, but a function that's grown long enough to require scrolling to see it all, or that a reader can't hold the whole purpose of in their head at once, is usually a signal that it's doing more than one thing and would benefit from extracting named sub-steps into their own functions. The extraction itself often improves readability even independent of the line-count reduction — `validateInput(); calculatePricing(); applyDiscounts(); saveOrder();` as a sequence of well-named calls is more readable than the same logic inlined, even if the total line count barely changes, because each named step documents what it does without the reader needing to read its body to find out.

## Parameter design
- **Keep parameter lists short** — beyond 3-4 parameters, consider whether some naturally group into a single object/struct parameter (`createUser({ name, email, role })` over `createUser(name, email, role, sendWelcomeEmail, isAdmin)`), which also makes call sites more self-documenting (named fields vs. positional arguments whose meaning isn't visible at the call site).
- **Avoid boolean parameters whose meaning isn't clear at the call site**: `sendEmail(user, true)` doesn't tell the reader what `true` means without looking up the function signature; `sendEmail(user, { urgent: true })` or two differently-named functions (`sendEmail`/`sendUrgentEmail`) are clearer. This is especially important for multiple boolean parameters in sequence (`createUser(true, false, true)`), which is essentially unreadable at the call site without constantly cross-referencing the signature.
- **Avoid output parameters** (mutating a parameter passed in to communicate a result) where the language/idiom supports returning a value instead — a function that returns its result is easier to reason about than one that mutates something passed to it, since the latter requires the reader to track a side effect rather than just reading the return value.

## Guard clauses and reducing nesting
Deeply nested conditionals (an "arrow" or "pyramid" shape, with the actual core logic buried several indent levels deep) are harder to read than the equivalent logic expressed with early returns/guard clauses that handle edge cases upfront and let the main logic sit at a shallow, consistent indentation level:

```
// Deeply nested — the actual logic is buried
function process(order) {
  if (order != null) {
    if (order.isValid) {
      if (order.items.length > 0) {
        // actual logic, 3 levels deep
        return calculateTotal(order);
      }
    }
  }
  return null;
}

// Guard clauses — edge cases handled upfront, main logic at top level
function process(order) {
  if (order == null) return null;
  if (!order.isValid) return null;
  if (order.items.length === 0) return null;

  return calculateTotal(order);
}
```
This isn't about eliminating all nesting (some is inherent to the logic) — it's about not letting the "normal case" logic get needlessly buried under handling for cases that could be dispatched with first.

## Avoid side effects hidden inside functions that look like pure computations
A function named/expected to be a pure computation (e.g. `calculateDiscount(order)`) that also, inside its body, writes to a database or mutates a shared/global variable is a common source of confusing bugs — the caller doesn't expect a side effect from something that reads like a calculation. Either make the side effect explicit in the name/signature, or (usually better) separate the pure computation from the side-effecting action into two distinct functions, called explicitly in sequence by the caller — this also makes the pure part trivially testable on its own (see `testability-and-tests.md`).

## Avoid deeply coupled functions that only make sense together
If two functions must always be called in a specific order, with the second relying on side effects/state set up by the first in a way that isn't obvious from either signature, consider whether they should actually be a single function (if they're always used together) or whether the dependency should be made explicit (e.g. the first function's result is passed as an explicit argument to the second, rather than communicated via a hidden shared/mutated state) — implicit ordering dependencies are a common, easy-to-violate-by-accident source of bugs when the code is later modified by someone unaware of the hidden requirement.

## Classes/modules: cohesion over convenience grouping
A class or module should represent one coherent concept/responsibility — group functions/data together because they conceptually belong together (they operate on the same core data, or represent one clear capability), not just because putting them in one file is convenient. A class accumulating many loosely-related methods and fields over time (a "god object," see `code-smells.md`) is a common result of adding "just one more thing" to an existing class rather than pausing to consider whether it belongs in a new, more focused one.