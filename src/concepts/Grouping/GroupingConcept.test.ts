import { assert, assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { freshID } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import GroupingConcept from "./GroupingConcept.ts";

// Helper function to create mock IDs for testing
const createMockUsers = (count: number): ID[] =>
  Array.from({ length: count }, () => freshID());

Deno.test("Grouping Concept Actions", async (t) => {
  const [db, client] = await testDb();
  const grouping = new GroupingConcept(db);
  const [admin, member1, requester] = createMockUsers(3);

  await t.step("createGroup: creates a new group successfully", async () => {
    console.log("  - Testing: createGroup (happy path)");
    const groupName = "Test Group 1";
    const result = await grouping.createGroup({ name: groupName, admin });

    assert(
      !("error" in result),
      `Should not return an error: ${"error" in result && result.error}`,
    );
    const { group } = result as { group: ID };
    assert(group, "Should return a group ID");

    console.log("  - Verifying effects of createGroup");
    const groupDoc = await grouping.groups.findOne({ _id: group });
    assert(groupDoc, "Group document should exist in the database");
    assertEquals(groupDoc.name, groupName);
    assertEquals(groupDoc.members, [admin]);
    assertEquals(groupDoc.memberRoles, { [admin]: "ADMIN" });
    assertEquals(groupDoc.requests, []);
  });

  await t.step("createGroup: fails if group name already exists", async () => {
    console.log(
      "  - Testing: createGroup (requires violation - duplicate name)",
    );
    const groupName = "Duplicate Name Group";
    await grouping.createGroup({ name: groupName, admin }); // Create first
    const result = await grouping.createGroup({ name: groupName, admin }); // Attempt duplicate

    assert("error" in result, "Should return an error for duplicate name");
    assertEquals(
      result.error,
      `Group with name '${groupName}' already exists.`,
    );
  });

  await t.step("deleteGroup: deletes an existing group", async () => {
    console.log("  - Testing: deleteGroup (happy path)");
    const { group } = await grouping.createGroup({
      name: "Group To Delete",
      admin,
    }) as { group: ID };
    const result = await grouping.deleteGroup({ group });

    assert(
      !("error" in result),
      "Should not return an error on successful deletion",
    );
    console.log("  - Verifying effects of deleteGroup");
    const groupDoc = await grouping.groups.findOne({ _id: group });
    assertEquals(
      groupDoc,
      null,
      "Group document should be null after deletion",
    );
  });

  await t.step("deleteGroup: fails if group does not exist", async () => {
    console.log(
      "  - Testing: deleteGroup (requires violation - group not found)",
    );
    const nonExistentGroup = freshID();
    const result = await grouping.deleteGroup({ group: nonExistentGroup });
    assert("error" in result, "Should return an error for non-existent group");
    assertEquals(result.error, "Group not found.");
  });

  await t.step(
    "renameGroup: successfully renames an existing group",
    async () => {
      console.log("  - Testing: renameGroup (happy path)");
      const { group } = await grouping.createGroup({
        name: "Old Name",
        admin,
      }) as { group: ID };
      const newName = "New Name";
      const result = await grouping.renameGroup({ group, newName });

      assert(
        !("error" in result),
        "Should not return an error on successful rename",
      );
      console.log("  - Verifying effects of renameGroup");
      const groupDoc = await grouping.groups.findOne({ _id: group });
      assertEquals(groupDoc?.name, newName);
    },
  );

  await t.step(
    "renameGroup: fails if the new name is already taken",
    async () => {
      console.log(
        "  - Testing: renameGroup (requires violation - duplicate newName)",
      );
      const { group: group1 } = await grouping.createGroup({
        name: "Group A",
        admin,
      }) as { group: ID };
      await grouping.createGroup({ name: "Group B", admin });
      const result = await grouping.renameGroup({
        group: group1,
        newName: "Group B",
      });

      assert(
        "error" in result,
        "Should return an error for conflicting new name",
      );
      assertEquals(result.error, "A group with name 'Group B' already exists.");
    },
  );

  await t.step("requestToJoin: successfully adds a join request", async () => {
    console.log("  - Testing: requestToJoin (happy path)");
    const { group } = await grouping.createGroup({
      name: "Joinable Group",
      admin,
    }) as { group: ID };
    const result = await grouping.requestToJoin({ group, requester });

    assert(
      !("error" in result),
      "Should not return an error when requesting to join",
    );
    console.log("  - Verifying effects of requestToJoin");
    const groupDoc = await grouping.groups.findOne({ _id: group });
    assert(
      groupDoc?.requests.includes(requester),
      "Requester should be in the requests list",
    );
  });

  await t.step("requestToJoin: fails if user is already a member", async () => {
    console.log(
      "  - Testing: requestToJoin (requires violation - user is member)",
    );
    const { group } = await grouping.createGroup({
      name: "Already Member Group",
      admin,
    }) as { group: ID };
    const result = await grouping.requestToJoin({ group, requester: admin });

    assert(
      "error" in result,
      "Should return an error if user is already a member",
    );
    assertEquals(result.error, "User is already a member of this group.");
  });

  await t.step(
    "confirmRequest & declineRequest: manage join requests",
    async (t) => {
      const { group } = await grouping.createGroup({
        name: "Request Management Group",
        admin,
      }) as { group: ID };
      await grouping.requestToJoin({ group, requester });

      await t.step("confirmRequest: adds user to members", async () => {
        console.log("    - Testing: confirmRequest (happy path)");
        const result = await grouping.confirmRequest({ group, requester });
        assert(
          !("error" in result),
          "Should not error on confirming a valid request",
        );

        console.log("    - Verifying effects of confirmRequest");
        const groupDoc = await grouping.groups.findOne({ _id: group });
        assert(
          groupDoc?.members.includes(requester),
          "Requester should now be a member",
        );
        assertEquals(
          groupDoc?.memberRoles[requester],
          "MEMBER",
          "New member should have MEMBER role",
        );
        assert(
          !groupDoc?.requests.includes(requester),
          "Request should be removed after confirmation",
        );
      });

      await t.step("declineRequest: removes user from requests", async () => {
        console.log("    - Testing: declineRequest (happy path)");
        const [anotherRequester] = createMockUsers(1);
        await grouping.requestToJoin({ group, requester: anotherRequester });
        const result = await grouping.declineRequest({
          group,
          requester: anotherRequester,
        });
        assert(
          !("error" in result),
          "Should not error on declining a valid request",
        );

        console.log("    - Verifying effects of declineRequest");
        const groupDoc = await grouping.groups.findOne({ _id: group });
        assert(
          !groupDoc?.requests.includes(anotherRequester),
          "Request should be removed after declining",
        );
      });
    },
  );

  await t.step("adjustRole: updates a member's role", async () => {
    console.log("  - Testing: adjustRole (happy path)");
    const { group } = await grouping.createGroup({
      name: "Role Adjust Group",
      admin,
    }) as { group: ID };
    await grouping.groups.updateOne({ _id: group }, {
      $addToSet: { members: member1 },
      $set: { [`memberRoles.${member1}`]: "MEMBER" },
    });

    const result = await grouping.adjustRole({
      group,
      member: member1,
      newRole: "ADMIN",
    });
    assert(!("error" in result), "Should not error when adjusting a role");

    console.log("  - Verifying effects of adjustRole");
    const groupDoc = await grouping.groups.findOne({ _id: group });
    assertEquals(groupDoc?.memberRoles[member1], "ADMIN");
  });

  await t.step("adjustRole: fails for invalid role", async () => {
    console.log("  - Testing: adjustRole (requires violation - invalid role)");
    const { group } = await grouping.createGroup({
      name: "Invalid Role Group",
      admin,
    }) as { group: ID };
    const result = await grouping.adjustRole({
      group,
      member: admin,
      newRole: "SUPERUSER" as "ADMIN",
    });

    assert("error" in result, "Should return an error for an invalid role");
    assert(
      result.error.startsWith("Invalid role:"),
      "Error message should indicate an invalid role",
    );
  });

  await t.step("removeMember: successfully removes a member", async () => {
    console.log("  - Testing: removeMember (happy path)");
    const { group } = await grouping.createGroup({
      name: "Removal Group",
      admin,
    }) as { group: ID };
    // Add a second admin to allow removal of the first
    await grouping.groups.updateOne({ _id: group }, {
      $addToSet: { members: member1 },
      $set: { [`memberRoles.${member1}`]: "ADMIN" },
    });

    const result = await grouping.removeMember({ group, member: admin });
    assert(!("error" in result), "Should not error when removing a member");

    console.log("  - Verifying effects of removeMember");
    const groupDoc = await grouping.groups.findOne({ _id: group });
    assert(
      !groupDoc?.members.includes(admin),
      "Member should be removed from members list",
    );
    assertEquals(
      groupDoc?.memberRoles[admin],
      undefined,
      "Member's role should be removed from memberRoles map",
    );
  });

  await t.step("removeMember: fails when removing the last admin", async () => {
    console.log("  - Testing: removeMember (requires violation - last admin)");
    const { group } = await grouping.createGroup({
      name: "Last Admin Group",
      admin,
    }) as { group: ID };
    const result = await grouping.removeMember({ group, member: admin });

    assert(
      "error" in result,
      "Should error when trying to remove the last admin",
    );
    assertEquals(result.error, "Cannot remove the last admin from a group.");
  });

  await client.close();
});

Deno.test("Grouping Concept Queries", async (t) => {
  const [db, client] = await testDb();
  const grouping = new GroupingConcept(db);
  const [admin, member, requester] = createMockUsers(3);
  const groupName = "Query Test Group";
  const { group } = await grouping.createGroup({
    name: groupName,
    admin,
  }) as { group: ID };
  // Setup state for queries
  await grouping.requestToJoin({ group, requester });
  await grouping.confirmRequest({ group, requester }); // requester is now a member
  await grouping.adjustRole({ group, member: requester, newRole: "MEMBER" }); // ensure requester is a member, not admin
  await grouping.groups.updateOne({ _id: group }, {
    $addToSet: { members: member },
    $set: { [`memberRoles.${member}`]: "MEMBER" },
  });

  await t.step("_getMembers: returns all members", async () => {
    const members = await grouping._getMembers({ group });
    const foundMembers = members.map((m) => m.member);
    assertEquals(new Set(foundMembers), new Set([admin, requester, member]));
  });

  await t.step("_getGroups: returns all group IDs", async () => {
    console.log("  - Testing: _getGroups (happy path)");
    // 'group' already exists from the test setup.
    // Create a second group to test that the query returns multiple IDs.
    const { group: group2 } = await grouping.createGroup({
      name: "Temporary Group for GetGroups",
      admin: createMockUsers(1)[0], // Use a new user as admin to avoid side effects
    }) as { group: ID };

    console.log("  - Verifying effects of _getGroups");
    const [{ groups }] = await grouping._getGroups();
    assertEquals(
      groups.length,
      2,
      "Should return the correct number of groups",
    );
    assertEquals(
      new Set(groups),
      new Set([group, group2]),
      "The set of returned group IDs should match the set of existing group IDs",
    );

    // Clean up to prevent affecting subsequent tests
    await grouping.deleteGroup({ group: group2 });
  });

  await t.step("_isGroupMember: returns correct boolean", async () => {
    const [{ inGroup: isMember }] = await grouping._isGroupMember({
      group,
      user: member,
    });
    const [{ inGroup: isNotMember }] = await grouping._isGroupMember({
      group,
      user: freshID(),
    });
    assertEquals(isMember, true);
    assertEquals(isNotMember, false);
  });

  await t.step("_getAdmins: returns only admins", async () => {
    const [{ admins }] = await grouping._getAdmins({ group });
    assertEquals(admins, [admin]);
  });

  await t.step("_isGroupAdmin: returns correct boolean", async () => {
    const [{ isAdmin: adminIsAdmin }] = await grouping._isGroupAdmin({
      group,
      user: admin,
    });
    const [{ isAdmin: memberIsAdmin }] = await grouping._isGroupAdmin({
      group,
      user: member,
    });
    assertEquals(adminIsAdmin, true);
    assertEquals(memberIsAdmin, false);
  });

  await t.step(
    "_getGroupRequests: returns users with pending requests",
    async () => {
      const [newRequester] = createMockUsers(1);
      await grouping.requestToJoin({ group, requester: newRequester });
      const requests = await grouping._getGroupRequests({ group });
      assertEquals(requests.length, 1);
      assertEquals(requests[0].requestingUser, newRequester);
    },
  );

  await t.step(
    "_getUserRequests: returns groups a user has requested to join",
    async () => {
      const [requesterUser] = createMockUsers(1);
      const { group: group2 } = await grouping.createGroup({
        name: "Second Test Group",
        admin: createMockUsers(1)[0],
      }) as { group: ID };

      // User has no requests initially
      const emptyRequests = await grouping._getUserRequests({
        user: requesterUser,
      });
      assertEquals(
        emptyRequests.length,
        0,
        "Should return empty array initially",
      );

      // User requests to join first group
      await grouping.requestToJoin({ group, requester: requesterUser });
      const requests1 = await grouping._getUserRequests({
        user: requesterUser,
      });
      assertEquals(requests1.length, 1, "Should return one group");
      assertEquals(
        requests1[0].group,
        group,
        "Should return the correct group",
      );

      // User requests to join second group
      await grouping.requestToJoin({ group: group2, requester: requesterUser });
      const requests2 = await grouping._getUserRequests({
        user: requesterUser,
      });
      assertEquals(requests2.length, 2, "Should return both groups");
      const requestedGroups = requests2.map((r) => r.group);
      assertEquals(
        new Set(requestedGroups),
        new Set([group, group2]),
        "Should return both requested groups",
      );

      // Clean up
      await grouping.deleteGroup({ group: group2 });
    },
  );

  await t.step("_getGroupName: finds a group's name", async () => {
    const [{ name }] = await grouping._getGroupName({
      group,
    });
    assertEquals(name, groupName);
  });

  await t.step("_getUserGroups: finds all groups for a user", async () => {
    // Create another group with the same admin
    await grouping.createGroup({ name: "Second Group", admin });
    const [{ group: userGroups }] = await grouping._getUserGroups({
      user: admin,
    });
    assertEquals(userGroups.length, 2, "Admin should be in two groups");
  });

  await client.close();
});

// # trace:
Deno.test("Principle Trace: Full Group Lifecycle", async () => {
  console.log("\n# Testing Principle Trace: Full Group Lifecycle");
  const [db, client] = await testDb();
  const grouping = new GroupingConcept(db);
  const [adminUser, memberUser, otherUser] = createMockUsers(3);

  console.log("1. An admin creates a private group.");
  const createResult = await grouping.createGroup({
    name: "Dev Team",
    admin: adminUser,
  });
  assert(!("error" in createResult), "Step 1: Group creation should succeed.");
  const { group } = createResult as { group: ID };
  console.log(`   - Group 'Dev Team' created with ID: ${group}`);

  console.log("\n2. A new user requests to join the group.");
  const requestResult = await grouping.requestToJoin({
    group,
    requester: memberUser,
  });
  assert(
    !("error" in requestResult),
    "Step 2: Request to join should succeed.",
  );

  console.log("\n3. The admin checks the requests and sees the new user.");
  const requests = await grouping._getGroupRequests({ group });
  assertEquals(
    requests[0]?.requestingUser,
    memberUser,
    "Step 3: Admin should see the member's request.",
  );
  console.log(`   - Found request from user: ${memberUser}`);

  console.log("\n4. The admin confirms the user's request.");
  const confirmResult = await grouping.confirmRequest({
    group,
    requester: memberUser,
  });
  assert(
    !("error" in confirmResult),
    "Step 4: Confirming request should succeed.",
  );

  console.log("\n5. Verify the user is now a member with the 'MEMBER' role.");
  const [{ inGroup }] = await grouping._isGroupMember({
    group,
    user: memberUser,
  });
  assert(inGroup, "Step 5: User should be a member.");
  const [{ isAdmin }] = await grouping._isGroupAdmin({
    group,
    user: memberUser,
  });
  assert(!isAdmin, "Step 5: New member should not be an admin.");
  console.log(`   - User ${memberUser} is now a member.`);

  console.log("\n6. The admin promotes the new member to 'ADMIN'.");
  const adjustResult = await grouping.adjustRole({
    group,
    member: memberUser,
    newRole: "ADMIN",
  });
  assert(!("error" in adjustResult), "Step 6: Role adjustment should succeed.");

  console.log("\n7. Verify the user now has the 'ADMIN' role.");
  const [{ isAdmin: isNowAdmin }] = await grouping._isGroupAdmin({
    group,
    user: memberUser,
  });
  assert(isNowAdmin, "Step 7: Member should now be an admin.");
  console.log(`   - User ${memberUser} is now an admin.`);

  console.log(
    "\n8. A third user joins and becomes a member (simplified join).",
  );
  await grouping.groups.updateOne({ _id: group }, {
    $push: { members: otherUser },
    $set: { [`memberRoles.${otherUser}`]: "MEMBER" },
  });
  const [{ inGroup: otherUserInGroup }] = await grouping._isGroupMember({
    group,
    user: otherUser,
  });
  assert(otherUserInGroup, "Step 8: Other user should be a member.");
  console.log(`   - User ${otherUser} is now a member.`);

  console.log("\n9. The new admin removes the original admin.");
  const removeResult = await grouping.removeMember({
    group,
    member: adminUser,
  });
  assert(
    !("error" in removeResult),
    "Step 9: Removing original admin should succeed.",
  );
  const [{ inGroup: originalAdminInGroup }] = await grouping._isGroupMember({
    group,
    user: adminUser,
  });
  assert(
    !originalAdminInGroup,
    "Step 9: Original admin should no longer be in the group.",
  );
  console.log(`   - Original admin ${adminUser} has been removed.`);

  console.log("\n10. The group is finally deleted by the remaining admin.");
  const deleteResult = await grouping.deleteGroup({ group });
  assert(!("error" in deleteResult), "Step 10: Group deletion should succeed.");
  const groupDoc = await grouping.groups.findOne({ _id: group });
  assertEquals(groupDoc, null, "Step 10: Group document should be deleted.");
  console.log(`   - Group 'Dev Team' has been deleted. Trace complete.`);

  await client.close();
});
