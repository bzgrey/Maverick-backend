
[@GroupingSyncs.md](../syncs/GroupingSyncs.md)
[@implementing-synchronizations](../background/implementing-synchronizations.md)
[@Grouping.md](../concepts/Grouping/Grouping.md)
[@UserAuthentication.md](../concepts/UserAuthentication/UserAuthentication.md)
[@Sessioning.md](../concepts/Sessioning/Sessioning.md)
[@Blocking.md](../concepts/Blocking/Blocking.md)

# Please update GroupingSyncs.md to have this much cleaner formatting:
```sync
sync AddQuestionRequest
when
    Requesting.request (path: "/LikertSurvey/addQuestion", survey, text): (request)
then
    LikertSurvey.addQuestion (survey, text)

sync AddQuestionResponse
when
    Requesting.request (path: "/LikertSurvey/addQuestion") : (request)
    LikertSurvey.addQuestion () : (question)
then
    Requesting.respond (request, question)

sync AddQuestionResponseError
when
    Requesting.request (path: "/LikertSurvey/addQuestion") : (request)
    LikertSurvey.addQuestion () : (error)
then
    Requesting.respond (request, error)
```

# response:

# GroupingSyncs.md

```sync
sync CreateGroupRequest
when
	Requesting.request (path: "/groups/create", session, groupName: string) : (request)
where
	Sessioning._getUser (session): {user}
then
	Grouping.createGroup (user, groupName)

sync CreateGroupResponse
when
	Requesting.request (path: "/groups/create") : (request)
	Grouping.createGroup () : {group}
then
	Requesting.respond (request, group: Group)

sync CreateGroupResponseError
when
	Requesting.request (path: "/groups/create") : (request)
	Grouping.createGroup () : (error: string)
then
	Requesting.respond (request, error)
```

```sync
sync AddMemberRequest
when
	Requesting.request (path: "/groups/addMember", session, groupId: string, memberId: string) : (request)
where
	// Get the user making the request.
	Sessioning._getUser (session): { requester }
	// Get the user to be added to the group.
	User._getUserById (id: memberId): { memberToAdd }
	// Get the group and its owner.
	Grouping._getGroup (id: groupId): ({ id: string, name: string, ownerId: string }, owner: { id: string, username: string })
	// Only the group owner can add members.
	requester.id is groupOwner.id
	// Neither the requester nor the member to add should have blocked the other.
	not Blocking._isBlocked (userA: memberToAdd, userB: requester)
	not Blocking._isBlocked (userA: requester, userB: memberToAdd)
then
	Grouping.addMember (group: group, member: memberToAdd)

sync AddMemberResponse
when
	Requesting.request (path: "/groups/addMember") : (request)
	Grouping.addMember () : (success: { message: string, addedMemberId: string })
then
	Requesting.respond (request, success)

sync AddMemberResponseError
when
	Requesting.request (path: "/groups/addMember") : (request)
	Grouping.addMember () : (error: string)
then
	Requesting.respond (request, error)
```

```sync
sync RemoveMemberRequest
when
	Requesting.request (path: "/groups/removeMember", session, groupId: string, memberId: string) : (request)
where
	Sessioning._getUser (session): {user}
	User._getUserById (id: memberId): { id: string, username: string }
	Grouping._getGroup (id: groupId): ({ id: string, name: string, ownerId: string }, owner: { id: string, username: string })
	// Requester is either the group owner OR the member themselves.
	(requester.id is groupOwner.id) or (requester.id is memberToRemove.id)
then
	Grouping.removeMember (group: group, member: memberToRemove)

sync RemoveMemberResponse
when
	Requesting.request (path: "/groups/removeMember") : (request)
	Grouping.removeMember () : (success: { message: string, removedMemberId: string })
then
	Requesting.respond (request, success)

sync RemoveMemberResponseError
when
	Requesting.request (path: "/groups/removeMember") : (request)
	Grouping.removeMember () : (error: string)
then
	Requesting.respond (request, error)
```

```sync
sync DeleteGroupRequest
when
	Requesting.request (path: "/groups/delete", session, groupId: string) : (request)
where
	Sessioning._getUser (session): {user}
	Grouping._getGroup (id: groupId): ({ id: string, name: string, ownerId: string }, owner: { id: string, username: string })
	// Only the group owner can delete the group.
	requester.id is groupOwner.id
then
	Grouping.deleteGroup (group: group)

sync DeleteGroupResponse
when
	Requesting.request (path: "/groups/delete") : (request)
	Grouping.deleteGroup () : (success: { message: string, deletedGroupId: string })
then
	Requesting.respond (request, success)

sync DeleteGroupResponseError
when
	Requesting.request (path: "/groups/delete") : (request)
	Grouping.deleteGroup () : (error: string)
then
	Requesting.respond (request, error)
```

```sync
// Scenario 1: Group has members, respond with them
sync GetGroupMembersRequestWithMembers
when
	Requesting.request (path: "/groups/members", session, groupId: string) : (request)
where
	Sessioning._getUser (session): {user}
	Grouping._getGroup (id: groupId): { id: string, name: string, ownerId: string }
	// Requester must be a member of the group to view its members.
	Grouping._isMember (group: group, member: requester)
	Grouping._getMembersCount (group: group): number
	count > 0
	// Query for members and their usernames
	Grouping._getMembers (group: group): { id: string }
	User._getUsername (user: member): string
	results is frames.collectAs([member, memberUsername], results)
then
	Requesting.respond (request, results: array< { member: { id: string }, memberUsername: string } >)

// Scenario 2: Group has no members, but request was valid, respond with empty array
sync GetGroupMembersRequestNoMembers
when
	Requesting.request (path: "/groups/members", session, groupId: string) : (request)
where
	Sessioning._getUser (session): {user}
	Grouping._getGroup (id: groupId): { id: string, name: string, ownerId: string }
	Grouping._isMember (group: group, member: requester)
	Grouping._getMembersCount (group: group): number
	count is 0
	results is []
then
	Requesting.respond (request, results: array<any>)

// Scenario 3: Request failed due to an error in a concept action
sync GetGroupMembersResponseError
when
	Requesting.request (path: "/groups/members") : (request)
	AnyConceptAction() : (error: string)
then
	Requesting.respond (request, error)
```

```sync
sync GetMyGroupsRequestWithGroups
when
	Requesting.request (path: "/groups/my-groups", session) : (request)
where
	Sessioning._getUser (session): {user}
	Grouping._getGroupDetails (group: group): (string, { id: string })
	User._getUsername (user: groupOwner) : string
then
	Requesting.respond (request, array< { group: Group} >)

sync GetMyGroupsResponseError
when
	Requesting.request (path: "/groups/my-groups") : (request)
	AnyConceptAction() : (error: string)
then
	Requesting.respond (request, error)
```