# Duplication & Abstraction

DRY ("don't repeat yourself") is a genuinely valuable principle, but applying it correctly requires distinguishing genuine duplication of a single underlying concept from superficial/coincidental similarity between things that are actually different concerns — conflating the two is one of the more common ways well-intentioned refactoring makes a codebase worse, not better.

## When duplication is a real problem
Repeated logic representing the *same underlying decision/rule/concept* is a real maintenance risk: if that rule needs to change, every duplicated copy needs to be found and updated consistently, and it's easy to miss one — leading to subtly inconsistent behavior across the codebase that's hard to trace (e.g. the business rule for "what counts as a valid discount code" implemented slightly differently in three different places, only one of which gets updated when the rule changes). This is the case DRY is meant to address: consolidate the rule into one place (a function, a constant, a shared module) so there's exactly one place to look and change it.

## When apparent duplication isn't actually the same thing
Two pieces of code can look similar today — similar structure, similar logic — while representing genuinely different concerns that happen to coincide right now but have no real reason to change together, or good reason to potentially diverge later. Forcing these into a shared abstraction because they currently look alike creates a different, sometimes worse problem: a single shared function/class now serving two purposes, which either has to grow special-case branches/parameters to handle both purposes' eventual divergence (making it harder to understand than either separate version would have been), or requires the abstraction to be un-shared again later (a genuinely disruptive refactor, more costly than if the duplication had simply been left alone until the divergence made the right abstraction clearer).

**A practical heuristic**: ask *why* the two pieces of code are similar. If it's because they represent the same rule/concept (validating an email address the same way in two places — there's really only one correct way to validate an email for this system), consolidate. If the similarity is coincidental (two different features that happen to both filter a list with a similar-looking predicate today, for unrelated business reasons), it's often fine — sometimes better — to leave them separate, since a shared abstraction here is coupling two things that don't conceptually belong together, purely because they look similar in their current form.

## The "rule of three"
A common, pragmatic guideline: don't abstract/extract a shared function on the first duplication — wait until a genuinely similar piece of logic shows up a third time before extracting a shared abstraction. This reduces the risk of abstracting prematurely based on a sample size of two (which might just be coincidental similarity, not yet clearly a pattern), while still catching real, repeated patterns before they spread further. This is a guideline, not a strict rule — obvious, clearly-conceptual duplication (the exact same validation rule copy-pasted twice) is often worth consolidating even at two instances; the rule of three is most useful as a check against abstracting too eagerly from limited evidence.

## Preferring composition/parameterization over branching abstractions
When two similar pieces of logic do need to be unified, prefer designs that let each caller supply what's different (a parameter, a passed-in function/strategy, a configuration object) over a single function that internally branches on a flag to decide which variant of behavior to run:
```
// Branching abstraction — the function's behavior depends on a flag, harder to
// reason about at the call site, and grows more branches as more variants appear
function processOrder(order, isExpressShipping) {
  if (isExpressShipping) { ... } else { ... }
}

// Parameterized — the caller supplies what's actually different, function stays
// focused on the shared logic
function processOrder(order, shippingStrategy) {
  const cost = shippingStrategy.calculateCost(order);
  ...
}
```
This scales better as more variants are added (new strategies rather than new internal branches) and keeps the shared function's logic focused on what's genuinely shared, with what varies made explicit at the call site rather than buried in conditional branches inside.

## Duplication is sometimes the right call, at least temporarily
Especially early in a feature's life, when it's genuinely unclear whether two similar-looking pieces of code will need to diverge, a small amount of duplication left in place — with a mental (or literal) note to revisit if a third similar case appears — is often a better trade than guessing at the wrong abstraction under uncertainty. Removing duplication is much easier and lower-risk than un-abstracting a wrong abstraction once other code has come to depend on its specific (now-wrong) shared shape.