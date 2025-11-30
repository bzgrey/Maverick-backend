---
timestamp: 'Sun Nov 30 2025 10:07:16 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_100716.d69b5637.md]]'
content_id: 030eed41155f435b0e9eddb4f633808777fdbee167dced591bc37fc869d7f46f
---

# file: src/grouping/groupingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assert, assertNotEquals } from "jsr:@std/assert";
import { GroupingConcept } from "./groupingConcept.ts"; // Assuming this is the concept implementation
import { ObjectId } from "npm:mongodb";

// Mock user and group data for consistency
const mockUsers = {
  alice: { _id: new ObjectId(), userId: "alice" },
  bob: { _id: new ObjectId(), userId: "bob" },
  charlie: { _id: new ObjectId(), userId: "charlie" },
};

Deno.test("GroupingConcept", async (t) => {
  await t.step("Action: createGroup", async (t) => {
    await t.step("requires: should fail if creator does not exist", async () => {
      console.log("\n  -> Testing: createGroup requirement failure (non-existent creator)");
      const [db, client] = await testDb();
      const concept = new GroupingConcept(db);
      const nonExistentCreatorId = new ObjectId().toHexString();

      console.log(`     Action: createGroup({ creatorId: "${nonExistentCreatorId}", name: "Ghost Group" })`);
      const result = await concept.actions.createGroup({
        creatorId: nonExistentCreatorId,
        name: "Ghost Group",
      });

      console.log("     Asserting: result contains an 'error' key.");
      assert("error" in result, "Action should have returned an error.");
      assertEquals(result.error, "Creator does not exist.");

      console.log("     Verifying: no group was created in the database.");
      const groupCount = await db.collection("groups").countDocuments();
      assertEquals(groupCount, 0);

      console.log("  <- Confirmed: Requirement correctly enforced.");
      await client.close();
    });

    await t.step("effects: should create a group and add creator as admin", async () => {
      console.log("\n  -> Testing: createGroup effect success (group creation and admin membership)");
      const [db, client] = await testDb();
      await db.collection("users").insertOne(mockUsers.alice);
      const concept = new GroupingConcept(db);

      console.log(`     Action: createGroup({ creatorId: "${mockUsers.alice._id}", name: "Book Club" })`);
      const result = await concept.actions.createGroup({
        creatorId: mockUsers.alice._id.toHexString(),
        name: "Book Club",
      });

      console.log("     Asserting: result does not contain an 'error' key and returns new IDs.");
      assert(!("error" in result), "Action should not have returned an error.");
      assert(result.groupId, "Result should contain the new groupId.");
      assert(result.membershipId, "Result should contain the new membershipId.");

      console.log("     Verifying: a new group exists with the correct name and creator.");
      const group = await db.collection("groups").findOne({ name: "Book Club" });
      assertNotEquals(group, null);
      assertEquals(group?.creatorId, mockUsers.alice._id);

      console.log("     Verifying: the creator is an admin in the new group.");
      const membership = await db.collection("memberships").findOne({
        groupId: group?._id,
        userId: mockUsers.alice._id,
      });
      assertNotEquals(membership, null);
      assertEquals(membership?.role, "admin");

      console.log("  <- Confirmed: Effects are correctly applied.");
      await client.close();
    });
  });

  await t.step("Action: addUserToGroup", async (t) => {
    await t.step("requires: should fail if inviter is not an admin", async () => {
        console.log("\n  -> Testing: addUserToGroup requirement failure (inviter is not admin)");
        const [db, client] = await testDb();
        // Setup: Alice creates a group, Bob and Charlie are users.
        await db.collection("users").insertMany([mockUsers.alice, mockUsers.bob, mockUsers.charlie]);
        const concept = new GroupingConcept(db);
        const { groupId } = await concept.actions.createGroup({
            creatorId: mockUsers.alice._id.toHexString(),
            name: "Test Group",
        });
        await concept.actions.addUserToGroup({
            adminId: mockUsers.alice._id.toHexString(),
            userId: mockUsers.bob._id.toHexString(),
            groupId: groupId!,
        }); // Bob is now a member, but not an admin

        console.log(`     Action: addUserToGroup by non-admin 'bob'`);
        const result = await concept.actions.addUserToGroup({
            adminId: mockUsers.bob._id.toHexString(), // Bob is not an admin
            userId: mockUsers.charlie._id.toHexString(),
            groupId: groupId!,
        });

        console.log("     Asserting: result contains an 'error' key.");
        assert("error" in result, "Action should have returned an error.");
        assertEquals(result.error, "Action requires administrator privileges.");

        console.log("     Verifying: 'charlie' was not added to the group.");
        const charlieMembership = await db.collection("memberships").findOne({ userId: mockUsers.charlie._id });
        assertEquals(charlieMembership, null);

        console.log("  <- Confirmed: Requirement correctly enforced.");
        await client.close();
    });

    await t.step("effects: should add a user to the group with 'member' role", async () => {
        console.log("\n  -> Testing: addUserToGroup effect success (user added as member)");
        const [db, client] = await testDb();
        await db.collection("users").insertMany([mockUsers.alice, mockUsers.bob]);
        const concept = new GroupingConcept(db);
        const { groupId } = await concept.actions.createGroup({
            creatorId: mockUsers.alice._id.toHexString(),
            name: "Test Group",
        });

        console.log(`     Action: addUserToGroup by admin 'alice' to add 'bob'`);
        const result = await concept.actions.addUserToGroup({
            adminId: mockUsers.alice._id.toHexString(),
            userId: mockUsers.bob._id.toHexString(),
            groupId: groupId!,
        });

        console.log("     Asserting: result does not contain an 'error' key.");
        assert(!("error" in result), "Action should not have returned an error.");
        
        console.log("     Verifying: 'bob' is now a member of the group with the 'member' role.");
        const bobMembership = await db.collection("memberships").findOne({
            userId: mockUsers.bob._id,
            groupId: new ObjectId(groupId!),
        });
        assertNotEquals(bobMembership, null);
        assertEquals(bobMembership?.role, "member");

        console.log("  <- Confirmed: Effects are correctly applied.");
        await client.close();
    });
  });

  await t.step("Principle: Group creation and management lifecycle", async () => {
    console.log("\n\n---\nTesting Principle: Group Lifecycle\n---");
    const [db, client] = await testDb();
    await db.collection("users").insertMany(Object.values(mockUsers));
    const concept = new GroupingConcept(db);

    // 1. Creation
    console.log("  [1] Alice creates 'The Adventurers Guild'.");
    const createResult = await concept.actions.createGroup({
      creatorId: mockUsers.alice._id.toHexString(),
      name: "The Adventurers Guild",
    });
    const groupId = createResult.groupId!;
    assert(groupId, "Principle Step 1 Failed: Group creation did not return a groupId.");
    console.log("      -> Group created successfully.");
    const aliceMembership = await db.collection("memberships").findOne({ userId: mockUsers.alice._id });
    assertEquals(aliceMembership?.role, "admin", "Principle Step 1 Check Failed: Alice should be an admin.");
    console.log("      -> Alice confirmed as admin.");

    // 2. Invitation
    console.log("  [2] Alice adds Bob to the group.");
    await concept.actions.addUserToGroup({
      adminId: mockUsers.alice._id.toHexString(),
      userId: mockUsers.bob._id.toHexString(),
      groupId,
    });
    const bobMembership = await db.collection("memberships").findOne({ userId: mockUsers.bob._id });
    assertEquals(bobMembership?.role, "member", "Principle Step 2 Check Failed: Bob should be a member.");
    console.log("      -> Bob added successfully as a member.");

    // 3. Promotion
    console.log("  [3] Alice promotes Bob to an admin.");
    await concept.actions.promoteToAdmin({
      promoterId: mockUsers.alice._id.toHexString(),
      userId: mockUsers.bob._id.toHexString(),
      groupId,
    });
    const bobMembershipUpdated = await db.collection("memberships").findOne({ userId: mockUsers.bob._id });
    assertEquals(bobMembershipUpdated?.role, "admin", "Principle Step 3 Check Failed: Bob should be an admin.");
    console.log("      -> Bob promoted to admin successfully.");

    // 4. Distributed Management
    console.log("  [4] Bob, now an admin, adds Charlie to the group.");
    await concept.actions.addUserToGroup({
      adminId: mockUsers.bob._id.toHexString(),
      userId: mockUsers.charlie._id.toHexString(),
      groupId,
    });
    const charlieMembership = await db.collection("memberships").findOne({ userId: mockUsers.charlie._id });
    assert(charlieMembership, "Principle Step 4 Check Failed: Charlie should be in the group.");
    assertEquals(charlieMembership?.role, "member");
    console.log("      -> Charlie added successfully by Bob, confirming distributed management.");

    // 5. Resilience
    console.log("  [5] Bob removes Alice (the creator) from the group.");
    await concept.actions.removeUserFromGroup({
      adminId: mockUsers.bob._id.toHexString(),
      userId: mockUsers.alice._id.toHexString(),
      groupId,
    });
    const aliceMembershipAfterRemove = await db.collection("memberships").findOne({ userId: mockUsers.alice._id });
    assertEquals(aliceMembershipAfterRemove, null, "Principle Step 5 Check Failed: Alice should be removed.");
    const adminCount = await db.collection("memberships").countDocuments({ groupId: new ObjectId(groupId), role: "admin" });
    assertEquals(adminCount, 1, "Principle Step 5 Check Failed: Bob should be the sole remaining admin.");
    console.log("      -> Alice removed successfully. The group remains manageable by Bob.");

    console.log("---\nPrinciple Confirmed\n---");
    await client.close();
  });
});

```
