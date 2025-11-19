---
timestamp: 'Tue Nov 18 2025 22:22:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251118_222229.4029f5ed.md]]'
content_id: 7cf478f5ff77801fa08b6193096f821251fef4a653b568bb94fc21b84eb76a0d
---

# response:

You've hit on a core concept of how the synchronization engine works! Let's break it down.

### Are syncs supposed to return arrays of dictionaries?

**Yes, fundamentally, the `where` clause of a synchronization is designed to return `Frames`, which is an array-like object containing `Frame` objects. Each `Frame` itself is a dictionary (or, more precisely, a `Record<symbol, unknown>`).**

Here's a more detailed explanation:

1. **What is a `Frame`?**
   * A `Frame` is an individual record (like a dictionary or JavaScript object) that holds a specific set of **variable bindings**.
   * These bindings are represented as `symbol` keys mapping to their `unknown` values (e.g., `[user]: "xavier"`, `[count]: 11`).
   * Each `Frame` represents a *single consistent context* or a *single "scenario"* for which the `then` actions might fire.

2. **What is `Frames`?**
   * `Frames` is a special class that extends JavaScript's native `Array`.
   * It holds a collection of these `Frame` objects.
   * When the `where` clause is executed, it receives a `Frames` object, and it's expected to return a `Frames` object.
   * The `then` clause then iterates over each `Frame` in the `Frames` object returned by `where`, firing its actions once for each `Frame` using the bindings defined within that `Frame`.

### Is that action/query dependent?

The *structure* of `Frames` (array of dictionaries) is not directly action/query dependent in terms of its type, but the *content* and *number* of `Frames` are heavily influenced by the `when` clause and particularly by the `.query()` method in the `where` clause.

1. **`when` clause:**
   * The `when` clause initially generates the `Frames` object that gets passed to the `where` clause.
   * If multiple `when` patterns match in different ways, or if there are multiple actions in the `when` clause that can combine in various ways, the initial `Frames` object might contain multiple `Frame` entries, each representing a unique combination of matching historical actions and their bindings.

2. **`.query()` method (within `where`):**
   * This is where the "array of dictionaries" concept becomes very dynamic.
   * When you call `frames.query(Concept._queryAction, inputPattern, outputPattern)`, the engine does the following for *each* `Frame` currently in `frames`:
     * It takes the bindings from the current `Frame` and uses them to fulfill the `inputPattern` for `Concept._queryAction`.
     * It executes `Concept._queryAction`.
     * If `Concept._queryAction` returns **multiple results** (which is common for queries like `_getByTarget` that return arrays of entities), `frames.query()` will effectively *fork* the current `Frame` into multiple new `Frames`, each containing the original bindings *plus* a unique binding from one of the query results.
     * For example, if you have `{ post: p1 }` and `_getByTarget` returns `[c1, c2, c3]`, the `.query()` call will transform `[{ post: p1 }]` into `[{ post: p1, comment: c1 }, { post: p1, comment: c2 }, { post: p1, comment: c3 }]`.
   * This automatic "forking" or "multiplication" of frames is how the engine handles iteration over query results declaratively.

3. **Actions (in `then`):**
   * Actions themselves do not return `Frames`. They are imperative commands executed based on the bindings provided by the `Frames`.
   * An action *might* return a value (e.g., `LikertSurvey.addQuestion() : (question)`) that can then be captured by the `when` clause of *another* synchronization, forming new `Frames` in *that* synchronization.

### The Role of `collectAs`

The `collectAs` method is specifically designed to transform a `Frames` object (an array of dictionaries) into a *smaller* `Frames` object, where some of the collected variables are grouped together into an array *within* a single `Frame`. This is particularly useful for building API responses that often need to return a list of items.

Without `collectAs`, if your `where` clause ended with multiple frames (e.g., `[{user: Alice, file: f1}, {user: Alice, file: f2}]`), the `then` clause `Requesting.respond({request, file})` would fire *multiple times*, once for `f1` and once for `f2`. `collectAs` allows you to consolidate this into a single `then` action that responds with an array like `{ request: ..., results: [{file: f1}, {file: f2}] }`.

**In summary:**

* `Frames` (an array of `Frame` objects) is the fundamental data structure for carrying variable bindings and managing iteration within a synchronization.
* The `where` clause is expected to receive and return a `Frames` object.
* The `.query()` method automatically handles creating multiple `Frames` when a query returns multiple results, essentially iterating for you.
* The `then` clause executes its actions once for *each* `Frame` that makes it through the `where` clause.
* `collectAs` is a utility for consolidating multiple `Frames` into fewer, or even a single `Frame`, where a binding's value becomes an array of collected data.
