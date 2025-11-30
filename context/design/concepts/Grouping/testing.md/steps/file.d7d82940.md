---
timestamp: 'Sun Nov 30 2025 10:16:15 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_101615.6f42590f.md]]'
content_id: d7d8294053d4a1236208265523d23d040709cafc9f16b06a010e34a8ecb1f648
---

# file: src/grouping/groupingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { GroupingConcept } from "./groupingConcept.ts"; // Assuming the concept is defined here
import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { ObjectId } from "npm:mongodb";

// Mock implementation for demonstration purposes, as the actual concept file is not provided.
// In a real scenario, this would be imported from "./groupingConcept.ts".
const MockGroupingConcept = {
  actions: {
    createGroup: async (db, { name }) => {
      if (!name) return { error: "Group name cannot be empty." };
      const existing = await db.collection("groups").findOne({ name });
      if (existing) return { error: "Group name must be unique." };
      const result = await db
        .collection("groups")
        .insertOne({ name, memberIds: [] });
      return result.insertedId;
    },
    addMember: async (db, { groupId, userId }) => {
      const group = await db.collection("groups").findOne({ _id: groupId });
      if (!group) return { error: "Group not found." };
      if (group.memberIds.some((id) => id.equals(userId))) {
        return { error: "User is already a member of this group." };
      }
      await db
        .collection("groups")
        .updateOne({ _id: groupId }, { $addToSet: { memberIds: userId } });
      return { success: true };
    },
    removeMember: async (db, { groupId, userId }) => {
      const group = await db.collection("groups").findOne({ _id: groupId });
      if (!group) return { error: "Group not found." };
      if (!group.memberIds.some((id) => id.equals(userId))) {
        return { error: "User is not a member of this group." };
      }
      await db
        .collection("groups")
        .updateOne({ _id: groupId }, { $pull: { memberIds: userId } });
      return { success: true };
    },
    deleteGroup: async (db, { groupId }) => {
      const result = await db.collection("groups").deleteOne({ _id: groupId });
      if (result.deletedCount === 0) return { error: "Group not found." };
      return { success: true };
    },
  },
};
// Use the mock in the test
const Concept = MockGroupingConcept;

Deno.test("GroupingConcept: actions", async (t) => {
  await t.step("createGroup action", async (t) => {
    await t.step(
      "effects: creates a new group successfully",
      async () => {
        console.log("\n--- Test: createGroup effects ---");
        const [db, client] = await testDb();
        const groupName = "Admins";

        console.log(`ACTION: createGroup with name: "${groupName}"`);
        const result = await Concept.actions.createGroup(db, {
          name: groupName,
        });
        assertNotEquals(result.error, undefined, "Action should not return an error object");
        const groupId = result as ObjectId;
        assertExists(groupId, "A group ID should be returned.");
        console.log(`EFFECT: Received group ID: ${groupId}`);

        console.log("CONFIRM: Verifying group exists in the database.");
        const groupInDb = await db.collection("groups").findOne({ _id: groupId });
        assertExists(groupInDb, "Group document should be found in DB.");
        assertEquals(groupInDb.name, groupName);
        assertEquals(groupInDb.memberIds, []);
        console.log("CONFIRMED: Group created correctly with an empty member list.");

        await client.close();
      },
    );

    await t.step(
      "requires: fails if group name already exists",
      async () => {
        console.log("\n--- Test: createGroup requires (uniqueness) ---");
        const [db, client] = await testDb();
        const groupName = "Moderators";

        console.log(`SETUP: Creating an initial group named "${groupName}".`);
        await Concept.actions.createGroup(db, { name: groupName });

        console.log(`ACTION: Attempting to create another group with the same name.`);
        const result = await Concept.actions.createGroup(db, {
          name: groupName,
        });

        assertExists(result.error, "Action should fail with an error.");
        assertEquals(result.error, "Group name must be unique.");
        console.log(`CONFIRMED: Action failed as expected with error: "${result.error}"`);

        await client.close();
      },
    );
  });

  await t.step("addMember action", async (t) => {
    await t.step("effects: adds a member to a group", async () => {
      console.log("\n--- Test: addMember effects ---");
      const [db, client] = await testDb();
      const userA = new ObjectId();

      console.log("SETUP: Creating a new group 'Developers'.");
      const groupId = (await Concept.actions.createGroup(db, {
        name: "Developers",
      })) as ObjectId;

      console.log(`ACTION: addMember with groupId: ${groupId} and userId: ${userA}`);
      const result = await Concept.actions.addMember(db, { groupId, userId: userA });
      assertEquals(result.success, true);
      console.log("EFFECT: Action reported success.");

      console.log("CONFIRM: Verifying the member list was updated in the database.");
      const groupInDb = await db.collection("groups").findOne({ _id: groupId });
      assertEquals(groupInDb?.memberIds?.length, 1);
      assertEquals(groupInDb?.memberIds?.[0], userA);
      console.log("CONFIRMED: User was successfully added to the group.");

      await client.close();
    });

    await t.step(
      "requires: fails if user is already a member",
      async () => {
        console.log("\n--- Test: addMember requires (already member) ---");
        const [db, client] = await testDb();
        const userA = new ObjectId();
        console.log("SETUP: Creating a group and adding a member.");
        const groupId = (await Concept.actions.createGroup(db, {
          name: "Testers",
        })) as ObjectId;
        await Concept.actions.addMember(db, { groupId, userId: userA });

        console.log("ACTION: Attempting to add the same member again.");
        const result = await Concept.actions.addMember(db, { groupId, userId: userA });

        assertExists(result.error, "Action should fail with an error.");
        assertEquals(
          result.error,
          "User is already a member of this group.",
        );
        console.log(`CONFIRMED: Action failed as expected with error: "${result.error}"`);

        await client.close();
      },
    );
  });

  await t.step("removeMember action", async (t) => {
    await t.step("effects: removes a member from a group", async () => {
        console.log("\n--- Test: removeMember effects ---");
        const [db, client] = await testDb();
        const userA = new ObjectId();
        const userB = new ObjectId();

        console.log("SETUP: Creating a group 'Support' with two members.");
        const groupId = (await Concept.actions.createGroup(db, {
          name: "Support",
        })) as ObjectId;
        await Concept.actions.addMember(db, { groupId, userId: userA });
        await Concept.actions.addMember(db, { groupId, userId: userB });

        console.log(`ACTION: removeMember to remove user ${userB}.`);
        const result = await Concept.actions.removeMember(db, { groupId, userId: userB });
        assertEquals(result.success, true);
        console.log("EFFECT: Action reported success.");

        console.log("CONFIRM: Verifying the member list was updated.");
        const groupInDb = await db.collection("groups").findOne({ _id: groupId });
        assertEquals(groupInDb?.memberIds?.length, 1);
        assertEquals(groupInDb?.memberIds?.[0], userA);
        console.log("CONFIRMED: User was successfully removed, and the other member remains.");

        await client.close();
      },
    );

    await t.step("requires: fails if user is not in the group", async () => {
        console.log("\n--- Test: removeMember requires (not a member) ---");
        const [db, client] = await testDb();
        const userA = new ObjectId();
        const userB = new ObjectId();

        console.log("SETUP: Creating a group 'Marketing' with one member (user A).");
        const groupId = (await Concept.actions.createGroup(db, {
          name: "Marketing",
        })) as ObjectId;
        await Concept.actions.addMember(db, { groupId, userId: userA });

        console.log("ACTION: Attempting to remove user B, who is not in the group.");
        const result = await Concept.actions.removeMember(db, {
          groupId,
          userId: userB,
        });

        assertExists(result.error, "Action should fail with an error.");
        assertEquals(result.error, "User is not a member of this group.");
        console.log(`CONFIRMED: Action failed as expected with error: "${result.error}"`);

        await client.close();
      },
    );
  });
});

Deno.test("GroupingConcept: principle", async () => {
  console.log("\n--- PRINCIPLE TEST: Full Group Management Lifecycle ---");
  const [db, client] = await testDb();

  const alice = new ObjectId();
  const bob = new ObjectId();
  const charlie = new ObjectId();

  console.log(
    "PRINCIPLE: A user can create a group, add members, remove a member, and finally delete the group.",
  );

  // 1. Create a group
  console.log("\n1. Alice creates a group named 'Project Phoenix'.");
  const groupId = (await Concept.actions.createGroup(db, {
    name: "Project Phoenix",
  })) as ObjectId;
  assertExists(groupId, "Step 1 Failed: Group creation should succeed.");
  console.log(` -> Group created with ID: ${groupId}`);

  // 2. Add members
  console.log("\n2. Alice adds Bob and Charlie to the group.");
  await Concept.actions.addMember(db, { groupId, userId: bob });
  await Concept.actions.addMember(db, { groupId, userId: charlie });
  console.log(` -> Added Bob (${bob}) and Charlie (${charlie}).`);

  console.log("   CONFIRM: Verifying both members are in the group.");
  let groupInDb = await db.collection("groups").findOne({ _id: groupId });
  assertEquals(groupInDb?.memberIds?.length, 2);
  assertEquals(
    groupInDb?.memberIds?.some((id) => id.equals(bob)),
    true,
  );
  assertEquals(
    groupInDb?.memberIds?.some((id) => id.equals(charlie)),
    true,
  );
  console.log("   -> Confirmed.");

  // 3. Remove a member
  console.log("\n3. Project changes, so Alice removes Charlie from the group.");
  await Concept.actions.removeMember(db, { groupId, userId: charlie });
  console.log(` -> Removed Charlie (${charlie}).`);

  console.log("   CONFIRM: Verifying Charlie is gone and Bob remains.");
  groupInDb = await db.collection("groups").findOne({ _id: groupId });
  assertEquals(groupInDb?.memberIds?.length, 1);
  assertEquals(groupInDb?.memberIds?.[0], bob);
  console.log("   -> Confirmed.");

  // 4. Delete the group
  console.log("\n4. The project is complete, so Alice deletes the group.");
  const deleteResult = await Concept.actions.deleteGroup(db, { groupId });
  assertEquals(deleteResult.success, true);
  console.log(" -> Group deleted.");

  console.log("   CONFIRM: Verifying the group no longer exists in the database.");
  groupInDb = await db.collection("groups").findOne({ _id: groupId });
  assertEquals(groupInDb, null);
  console.log("   -> Confirmed.");

  console.log("\nSUCCESS: The principle trace for GroupingConcept completed as expected.");
  await client.close();
});
```
