import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import PreferencingConcept from "./PreferencingConcept.ts";

// Test constants
const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const item1 = "item:Gizmo" as ID;
const item2 = "item:Widget" as ID;

Deno.test("PreferencingConcept: addScore Action", async (t) => {
  const [db, client] = await testDb();
  const concept = new PreferencingConcept(db);

  await t.step(
    "should assign an item and score to a user without a preference",
    async () => {
      console.log(
        "  - Action: addScore({ user: userA, item: item1, score: 10 })",
      );
      const result = await concept.addScore({
        user: userA,
        item: item1,
        score: 10,
      });
      assertEquals(result, {}, "addScore should succeed with an empty object");

      console.log("  - Confirming effects: checking score for userA on item1");
      const scoreResult = await concept._getScore({ user: userA, item: item1 });
      assertEquals(scoreResult.length, 1, "There should be one score entry");
      assertEquals(scoreResult[0].score, 10, "The score should be 10");

      console.log("  - Confirming effects: checking all items for userA");
      const itemsResult = await concept._getAllItems({ user: userA });
      assertEquals(itemsResult.length, 1);
      assertEquals(itemsResult[0].items, [item1], "The user should have item1");
    },
  );

  await t.step("should fail if the user already has a preference", async () => {
    console.log("  - Requirement check: User A already has a score for item1");
    console.log("  - Action: addScore({ user: userA, item: item2, score: 5 })");
    const result = await concept.addScore({
      user: userA,
      item: item2,
      score: 5,
    });
    assertExists(result.error, "addScore should return an error");
    assertEquals(
      result.error,
      "User already has a scored item. Use updateScore or removeScore first.",
    );

    console.log("  - Confirming effects: state should be unchanged");
    const scoreResult = await concept._getScore({ user: userA, item: item1 });
    assertEquals(scoreResult[0].score, 10, "Score for item1 should remain 10");

    const newScoreResult = await concept._getScore({
      user: userA,
      item: item2,
    });
    assertEquals(
      newScoreResult.length,
      0,
      "No score should be added for item2",
    );
  });

  await client.close();
});

Deno.test("PreferencingConcept: updateScore Action", async (t) => {
  const [db, client] = await testDb();
  const concept = new PreferencingConcept(db);

  // Setup: give userA a score
  await concept.addScore({ user: userA, item: item1, score: 10 });

  await t.step(
    "should update the score for a user's existing item",
    async () => {
      console.log(
        "  - Action: updateScore({ user: userA, item: item1, score: 20 })",
      );
      const result = await concept.updateScore({
        user: userA,
        item: item1,
        score: 20,
      });
      assertEquals(result, {}, "updateScore should succeed");

      console.log("  - Confirming effects: checking score for userA on item1");
      const scoreResult = await concept._getScore({ user: userA, item: item1 });
      assertEquals(scoreResult[0].score, 20, "Score should be updated to 20");
    },
  );

  await t.step("should fail if the user has no preference", async () => {
    console.log("  - Requirement check: User B has no score");
    console.log(
      "  - Action: updateScore({ user: userB, item: item1, score: 15 })",
    );
    const result = await concept.updateScore({
      user: userB,
      item: item1,
      score: 15,
    });
    assertExists(result.error, "updateScore should return an error");
    assertEquals(result.error, "User has no scored item to update.");
  });

  await t.step(
    "should fail if the user is scored on a different item",
    async () => {
      console.log(
        "  - Requirement check: User A is scored on item1, not item2",
      );
      console.log(
        "  - Action: updateScore({ user: userA, item: item2, score: 15 })",
      );
      const result = await concept.updateScore({
        user: userA,
        item: item2,
        score: 15,
      });
      assertExists(result.error, "updateScore should return an error");
      assertEquals(result.error, "User is not scored on the specified item.");

      console.log(
        "  - Confirming effects: score for item1 should be unchanged",
      );
      const scoreResult = await concept._getScore({ user: userA, item: item1 });
      assertEquals(scoreResult[0].score, 20, "Score should remain 20");
    },
  );

  await client.close();
});

Deno.test("PreferencingConcept: removeScore Action", async (t) => {
  const [db, client] = await testDb();
  const concept = new PreferencingConcept(db);

  // Setup: give userA a score
  await concept.addScore({ user: userA, item: item1, score: 10 });

  await t.step(
    "should fail if removing a score for the wrong item",
    async () => {
      console.log(
        "  - Requirement check: User A is scored on item1, not item2",
      );
      console.log("  - Action: removeScore({ user: userA, item: item2 })");
      const result = await concept.removeScore({ user: userA, item: item2 });
      assertExists(result.error, "removeScore should return an error");
      assertEquals(result.error, "User is not scored on the specified item.");
    },
  );

  await t.step(
    "should clear a user's preference for the correct item",
    async () => {
      console.log("  - Action: removeScore({ user: userA, item: item1 })");
      const result = await concept.removeScore({ user: userA, item: item1 });
      assertEquals(result, {}, "removeScore should succeed");

      console.log("  - Confirming effects: userA should have no scored items");
      const scoreResult = await concept._getScore({ user: userA, item: item1 });
      assertEquals(
        scoreResult.length,
        0,
        "No score entry should exist for userA",
      );

      const itemsResult = await concept._getAllItems({ user: userA });
      assertEquals(itemsResult.length, 1);
      assertEquals(
        itemsResult[0].items.length,
        0,
        "User's items list should be empty",
      );
    },
  );

  await t.step(
    "should fail if the user has no preference to remove",
    async () => {
      console.log("  - Requirement check: User A no longer has a score");
      console.log("  - Action: removeScore({ user: userA, item: item1 })");
      const result = await concept.removeScore({ user: userA, item: item1 });
      assertExists(result.error, "removeScore should return an error");
      assertEquals(result.error, "User has no scored item to remove.");
    },
  );

  await client.close();
});

Deno.test("PreferencingConcept: Principle Test", async () => {
  console.log("\nPrinciple: A user can only have one scored item at a time.");
  console.log(
    "This trace demonstrates how a user changes their preference from one item to another.",
  );

  const [db, client] = await testDb();
  const concept = new PreferencingConcept(db);

  console.log("\n1. Alice adds a score of 10 to Item 1.");
  let result = await concept.addScore({ user: userA, item: item1, score: 10 });
  assertEquals(result, {});
  let score = await concept._getScore({ user: userA, item: item1 });
  assertEquals(score[0].score, 10);
  console.log("  - Success: Alice has score 10 for Item 1.");

  console.log(
    "\n2. Alice tries to add a score to Item 2 directly (this should fail as per 'addScore' requirements).",
  );
  result = await concept.addScore({ user: userA, item: item2, score: 8 });
  assertExists(result.error);
  console.log(
    "  - Success: Action failed as expected. Alice must explicitly change her preference.",
  );

  console.log(
    "\n3. To change her preference, Alice first removes her score from Item 1.",
  );
  result = await concept.removeScore({ user: userA, item: item1 });
  assertEquals(result, {});
  let items = await concept._getAllItems({ user: userA });
  assertEquals(items[0].items.length, 0);
  console.log("  - Success: Alice no longer has a scored item.");

  console.log("\n4. Now, Alice adds a score of 8 to Item 2.");
  result = await concept.addScore({ user: userA, item: item2, score: 8 });
  assertEquals(result, {});
  score = await concept._getScore({ user: userA, item: item2 });
  assertEquals(score[0].score, 8);
  items = await concept._getAllItems({ user: userA });
  assertEquals(items[0].items, [item2]);
  console.log(
    "  - Success: Alice's preference has been updated to Item 2 with a score of 8.",
  );
  console.log(
    "\nPrinciple is satisfied: The actions enforce that a user has at most one scored item, and changing it is a two-step process (remove then add).",
  );

  await client.close();
});
