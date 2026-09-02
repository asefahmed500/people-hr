# Testability & Tests

Code that's easy to test correctly is very often also code that's well-structured for other reasons — the two concerns reinforce each other, so writing for testability tends to improve overall design, not just add test coverage.

## What makes code hard to test (and why that's a design smell too)
- **Hidden dependencies**: a function that reaches out to global state, a singleton, the current time (`Date.now()`), or the filesystem/network directly inside its body, rather than receiving these as explicit inputs, is hard to test in isolation (a test can't easily substitute a fake/controlled version of that dependency) — and this same hidden-dependency problem also makes the function harder to reason about for a human reader, who can't tell what the function actually depends on just from its signature.
- **Mixed logic and side effects**: a function that both computes something and performs I/O/mutates external state in the same body is hard to test (the test has to deal with the side effect just to verify the computation) and, per `functions-and-structure.md`, is also a design smell independent of testing.
- **Large, multi-responsibility functions/classes**: hard to write a focused test for, since a single test ends up needing to set up and verify many unrelated things at once — the same "does one thing" quality that makes a function readable also makes it easy to test with a small, focused test.

## Dependency injection (the basic idea, language-agnostic)
Instead of a function/class reaching out and directly instantiating or looking up its dependencies internally, pass them in explicitly (as constructor arguments, function parameters, or via a language's DI framework if one is idiomatic in that ecosystem):
```
// Hard to test — internally coupled to a specific concrete implementation
function sendWelcomeEmail(user) {
  const mailer = new SmtpMailer(PRODUCTION_SMTP_CONFIG);
  mailer.send(user.email, "Welcome!");
}

// Testable — the dependency is passed in, so a test can substitute a fake/mock
function sendWelcomeEmail(user, mailer) {
  mailer.send(user.email, "Welcome!");
}
```
This isn't about using a heavyweight DI framework for every project — even the simplest version (accepting a dependency as a parameter instead of hardcoding it inside) captures most of the testability benefit, and is often sufficient without introducing more machinery than the codebase actually needs.

## Separating pure logic from side effects
Where feasible, structure code so the actual decision-making/computation is a pure function (same input always produces same output, no side effects) separate from the code that performs the actual I/O/side effect based on that decision:
```
// Mixed — hard to test the discount logic without also triggering a DB write
function applyDiscount(order) {
  const discount = order.total > 100 ? 0.1 : 0;
  db.orders.update(order.id, { discount }); // side effect buried inside
  return discount;
}

// Separated — the pure calculation is trivially testable on its own
function calculateDiscount(order) {
  return order.total > 100 ? 0.1 : 0;
}
// caller does: const discount = calculateDiscount(order); db.orders.update(order.id, { discount });
```
The pure function needs no mocks, no setup, no I/O to test — just call it with inputs and assert on the output. This separation ("functional core, imperative shell" is one common name for the pattern) is one of the most effective, broadly-applicable ways to make a codebase more testable without adopting any particular testing framework or methodology.

## What's actually worth testing
Prioritize based on risk and value, not raw coverage percentage as a goal in itself:
- **The cases enumerated in Step 1 of the main workflow** — edge cases, boundary values, error/failure paths — not just the happy path. A test suite that only exercises the happy path gives false confidence; the bugs that actually reach production disproportionately live in the edge/error cases that weren't tested.
- **Business-critical/high-risk logic** (pricing calculations, permission checks, anything involving money — see the auth-design and system-design-building-blocks payment-systems references for domain-specific correctness concerns that absolutely warrant thorough testing) more thoroughly than low-risk, simple, or rarely-changing code.
- **Code that's likely to change or be refactored** — tests here provide a safety net that catches regressions when the implementation is later modified, which is a large part of tests' ongoing value beyond initial correctness verification.
- **Bugs, once found**: when fixing a bug, add a test that would have caught it (a regression test) — this both verifies the fix and prevents the same bug from silently reappearing later.

## What's often not worth heavy testing investment
- Trivial code with no real logic (a pure pass-through getter, simple data mapping with no conditional logic) — testing every such line for its own sake mostly adds maintenance burden (tests that need updating whenever the trivial code changes) without catching real bugs, since there's little for a bug to hide in.
- Third-party library internals — test that your code uses the library correctly for your specific cases, not the library's own already-tested behavior.

## Test readability matters too
Tests are code, read by humans (including future maintainers debugging a failure) — the same naming/structure clarity principles apply. A test name should describe the scenario and expected outcome (`calculatesZeroDiscountForOrdersUnder100`, not `test1`); test setup should be clear about what state is being established and why; a failing test's output/name should make it reasonably clear what broke, without requiring the reader to dig through the test's implementation to understand what was even being verified.