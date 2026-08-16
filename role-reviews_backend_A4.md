## Campus Events & Clubs
## Hein Htut Aung — Backend API and Database
---
## Summary
PRD data model is sound but lacks implementation details: API schemas, indexing strategy, timezone handling, token verification, error formats, and activity update policies.

---
## All Findings
| ID | PRD section | Issue or question | Why it matters | Severity | Recommended change |
|---|---|---|---|---|---|
| BE-01 | API/11 | No request/response schemas | Inconsistent implementation | High | Create OpenAPI spec |
| BE-02 | Data/8 | Role field lacks enum | Auth unpredictability | High | Enforce STUDENT/ORGANIZER |
| BE-03 | Arch/9 | Timezone conversion unclear | Wrong event times | High | Specify UTC + conversion |
| BE-04 | Data/8 | No cascade/soft-delete rules | Data orphaning | Medium | Define deletion strategy |
| BE-05 | API/11 | Error format not standardized | Inconsistent handling | Medium | Provide JSON schema |
| BE-06 | Data/8 | Incomplete indexing | Query slowdown | Medium | Add foreign key indexes |
| BE-07 | Rules/7 | No past-date validation | Invalid events | Medium | Validate date ≥ now |
| BE-08 | Rules/7 | Updates after registration undefined | Registration validity | Medium | Lock PUBLISHED or audit? |
| BE-09 | Stack/10 | No backup/recovery policy | Data loss risk | Low | Document retention |
---
## Decision Requests For The Group
1. **API Specification** — OpenAPI with schemas, validation, error codes
2. **Indexing** — Document all indexes in migration scripts
3. **Timezone** — Agree on campus TZ (e.g., UTC+7); always store UTC
4. **Error Format** — Standardized JSON: `{code, message, fields}`
5. **Activity Update Policy** — Can organizers modify date_time/location after registration? If yes: notify students + audit log? If no: lock PUBLISHED activities