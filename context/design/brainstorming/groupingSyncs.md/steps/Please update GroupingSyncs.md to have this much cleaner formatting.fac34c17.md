---
timestamp: 'Tue Nov 18 2025 22:43:42 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251118_224342.ae96a757.md]]'
content_id: fac34c17102eed235a2222c5bfafc981d546137c709848775fc09f355cf46b18
---

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
