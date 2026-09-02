# Error Handling

Decide deliberately, for each failure-prone operation, how it should fail — this is a design decision, not an afterthought to bolt on once the happy path works.

## The core question: throw, handle, or propagate?
For any operation that can fail (I/O, parsing, a dependency call, an operation on user-provided input), decide explicitly:
- **Handle locally** if there's a genuinely correct fallback/default behavior the function itself can apply (e.g. a cache lookup miss falling back to computing the value fresh) — and only if that fallback is actually correct, not just convenient to avoid dealing with the error.
- **Propagate (let it throw/return an error up)** if the current function doesn't have enough context to correctly decide what should happen on failure — let a caller with more context decide, rather than guessing or silently swallowing it.
- **Throw a new, more specific/meaningful error** if the current function has context that makes a more specific error meaningful to callers than the raw underlying failure (e.g. catching a low-level "connection refused" and re-throwing as a domain-meaningful `PaymentServiceUnavailableError`, preserving the original error as the cause) — this is often better than either blindly propagating the raw low-level error (unclear to callers what actually failed) or swallowing it.

## Never silently swallow errors
```
// Almost always wrong — the failure vanishes with no trace
try {
  riskyOperation();
} catch (e) {
  // empty, or just a comment
}
```
An empty or no-op catch block means a real failure happens and nothing — not the user, not a log, not any calling code — ever finds out. This is one of the most consequential anti-patterns in error handling: it doesn't prevent the failure, it just hides the evidence, making the eventual downstream symptom (wrong data, a confusing later error) much harder to trace back to its actual cause. At an absolute minimum, log the error with enough context to diagnose it later, even in the rare cases where truly no other action is needed.

## Avoid ambiguous sentinel values
Returning a special value (`-1`, `null`, `undefined`, an empty string) to mean "this failed" or "this wasn't found," especially when that same value could also be a legitimate successful result, forces every caller to remember to check for it and creates ambiguity about what a given return value actually means:
```
// Ambiguous: does null mean "not found" or "an error occurred"? Does a caller
// forgetting to check null get a confusing downstream crash instead of a clear signal?
function findUser(id) { ... return null; }
```
Prefer, depending on the language/idiom: a typed error/exception for actual failures (distinct from a legitimate "not found" result), an explicit result/option type (`Result<User, Error>`, `Option<User>`) where the language supports it, or at minimum a clearly-documented and consistently-applied convention (e.g. "this always returns `null` for not-found, and throws for actual errors — never returns `null` to mean 'error'"). The goal is that a caller reading the signature (or the language's type system) can tell what outcomes are possible, rather than needing to read the implementation or guess.

## Fail fast and loud for programmer errors vs. gracefully for expected failures
Distinguish two different categories of "things that go wrong":
- **Expected, recoverable failures** (a network request times out, a user submits invalid input, a file doesn't exist) — these are normal operating conditions the code should handle gracefully with a clear path (retry, show a validation error, return a meaningful "not found").
- **Programmer errors / invariant violations** (a function called with arguments that should be structurally impossible given correct calling code, an assertion about internal state that should always hold) — these should generally fail loudly and immediately (an assertion, an unchecked exception) rather than being caught and "handled," since silently working around a violated invariant often masks a real bug and can lead to worse, harder-to-diagnose corruption later. Don't write defensive `if` checks around conditions that indicate a bug elsewhere in the code as if they were expected, recoverable situations — let them surface clearly.

## Error messages and context
An error message/exception should carry enough context for whoever eventually reads it (a log, a debugger, an on-call engineer) to understand what happened without needing to reproduce it from scratch: what operation was being attempted, what the relevant input/identifiers were (an order ID, a user ID — being mindful not to log genuinely sensitive data like passwords or full payment details, per security-review's data-protection guidance), and the underlying cause if this error wraps a lower-level one (preserve the original error as a "cause"/inner exception rather than discarding it when re-throwing a higher-level error).

## Don't use exceptions/errors for ordinary control flow
Throwing and catching an exception to represent a normal, expected branch of logic (e.g. using an exception purely to break out of a loop, or to signal "not found" in a context where "not found" is a completely ordinary, frequent outcome rather than a genuine failure) is usually worse than a normal conditional/return — exceptions typically carry real overhead (stack unwinding, capturing a stack trace) and, more importantly, obscure the actual control flow for readers who now have to trace exception propagation to understand ordinary logic. Reserve exceptions/errors for genuinely exceptional/unexpected conditions.

## Cleanup and resource handling
Ensure resources (file handles, network connections, locks, database transactions) are released even when an error occurs partway through — use the language's structured cleanup mechanism (`try/finally`, `with`/context managers, `using`, RAII/destructors, `defer`) rather than manually remembering to release the resource at the end of the normal path, which is easy to miss on an error/early-return path. A resource leak triggered specifically by the error path is a common, easy-to-miss bug precisely because it only shows up under failure conditions that may not be exercised in casual testing.