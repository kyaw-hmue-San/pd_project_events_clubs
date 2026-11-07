# Validation Plan

## Digital Campus → Campus Services
## Events & Clubs

**Team:** Team 12  
**Team Size:** 5  
**Project:** Campus Services — Events & Clubs  
**Purpose:** Validate the problem, users, workflow, pain points, and MVP assumptions before treating them as confirmed requirements.

---

# 1. Validation Objective

The purpose of validation is to determine whether the problem identified by Team 12 is real for university students and activity organizers.

The team should validate:

1. Whether students have difficulty discovering campus activities.
2. Whether activity information is currently distributed across multiple channels.
3. Whether students have difficulty knowing activity details and registration status.
4. Whether students need a simpler registration-management process.
5. Whether organizers have difficulty publishing activities and managing registrations.
6. Whether the proposed MVP solves the most important part of the problem.

Validation should happen before expanding the MVP with additional features.

---

# 2. Main Hypothesis

## Problem Hypothesis

> University students have difficulty discovering and managing participation in campus events and club activities because activity information and registration processes are distributed across different channels.

## User Hypothesis

### Primary User

University students who want to discover and participate in campus activities.

### Secondary User

Students or university members responsible for organizing events and club activities.

---

# 3. Assumptions to Validate

| ID | Assumption | Importance | Validation Method | Success Signal |
|---|---|---|---|---|
| VA-01 | Students have difficulty discovering relevant campus activities | High | Student interviews/survey | Multiple students describe discovery as a problem |
| VA-02 | Activity information is distributed across multiple channels | High | Student interviews | Students report checking multiple sources |
| VA-03 | Students sometimes miss activities because information is difficult to find | High | Student interviews/survey | Evidence of missed or late-discovered activities |
| VA-04 | Students need a clear place to see activity details | High | Interviews + prototype test | Users identify details as important |
| VA-05 | Students want to know whether their registration succeeded | High | Interviews | Registration confirmation is repeatedly mentioned |
| VA-06 | Students need to view their current registrations | Medium | Interviews | Users report difficulty tracking registrations |
| VA-07 | Students may need to cancel registrations | Medium | Interviews | Users report needing to change/cancel participation |
| VA-08 | Organizers have difficulty maintaining activity information | High | Organizer interviews | Organizers describe current publishing/management problems |
| VA-09 | Organizers need to see who registered | High | Organizer interviews | Registration management is identified as a real need |
| VA-10 | A single web platform would improve the current workflow | High | Prototype testing | Users prefer the proposed workflow over the current process |
| VA-11 | Students are willing to use a university activity platform | High | Survey/interviews | Majority indicate willingness to use it |
| VA-12 | The proposed MVP is sufficient to solve the core problem | High | Prototype usability test | Users can complete the core journey successfully |

---

# 4. Current Workflow Validation

The current workflow is currently treated as a hypothesis.

## Student

```text
Find information
      ↓
Check one or more channels
      ↓
Read activity details
      ↓
Find registration method
      ↓
Register
      ↓
Remember/check registration status
      ↓
Attend or cancel
```

For each step, ask students what channel they use, how often the step fails, and what evidence they keep after registering.

## Organizer

```text
Prepare activity information
      ↓
Publish through one or more channels
      ↓
Collect registrations
      ↓
Answer participant questions
      ↓
Update or cancel activity information
      ↓
Track participation
```

The team must compare this assumed workflow with at least three real organizer workflows and record differences.

---

# 5. Research Method

Use a small mixed-method study appropriate for a student project:

| Participant group | Minimum target | Method | Purpose |
|---|---:|---|---|
| Students who joined or considered a campus activity in the last year | 8 | 15–20 minute interview | Understand discovery, registration, confirmation, and cancellation problems |
| Event or club organizers | 3 | 20–30 minute interview | Understand publishing and registration-management work |
| Students using the prototype | 5 | Moderated usability test | Test the proposed core journey |

These are minimum learning targets, not statistically representative survey samples. If the course requires statistical claims, the team must design a larger survey with instructor guidance.

## Recruitment

- Recruit participants from more than one faculty, year, or activity group when possible.
- Do not recruit only close teammates or people already familiar with the proposed design.
- Participation must be voluntary.
- Do not collect grades, passwords, authentication tokens, or unnecessary personal information.

---

# 6. Interview Questions

## Student Questions

1. Tell us about the last campus event or club activity you tried to find.
2. Where did you first hear about it?
3. Which other channels did you need to check?
4. What information was missing or difficult to understand?
5. How did you register, and how did you know it succeeded?
6. How do you currently remember or review registrations?
7. Have you ever needed to cancel? What happened?
8. What is the most frustrating part of this process?
9. What would make a single campus activity website useful enough to revisit?

## Organizer Questions

1. How do you currently publish an activity?
2. How many channels must you update when details change?
3. How do you collect and review registrations?
4. What duplicate, incomplete, or outdated data problems occur?
5. How do students receive confirmation?
6. How do you handle cancellation or changed activity information?
7. Which participant information is genuinely necessary?
8. What would prevent you from adopting the proposed workflow?

Avoid leading questions such as “Wouldn't one platform be easier?” Ask participants to describe real past behavior before asking about the proposed solution.

---

# 7. Prototype Test

Give each participant the same tasks without explaining the interface:

1. Find a published activity that interests you.
2. Identify its date, location, organizer, and registration availability.
3. Register for the activity.
4. Confirm that the registration succeeded.
5. Find the registration again.
6. Cancel it and confirm the new status.

Record:

- task completion without assistance;
- completion time;
- wrong turns or confusion;
- missing information;
- user comments;
- severity of each usability problem.

Success for the core journey is at least 80% unassisted completion among the prototype participants. With five participants, this means at least four complete the journey without assistance.

---

# 8. Evidence Record

Store anonymized findings in the following form:

| Evidence ID | Participant group | Observation | Related assumption | Supports / contradicts / unclear | Product implication |
|---|---|---|---|---|---|
| EV-01 | Student |  | VA-01 |  |  |

Do not record participant names in the shared repository. Use anonymous identifiers such as `STU-01` and `ORG-01`. Keep consent records outside the public repository.

---

# 9. Decision Rules

After research, classify each assumption:

- **Validated:** Repeated evidence supports the assumption strongly enough for the MVP.
- **Partially validated:** Evidence supports only part of the assumption; revise the requirement.
- **Not validated:** Evidence is weak or contradictory; remove or defer the feature.
- **Inconclusive:** More targeted research is required.

For every High-importance assumption, record a decision before freezing the MVP backlog.

| Assumption ID | Result | Evidence IDs | Requirement or PRD change | Owner |
|---|---|---|---|---|
| VA-01 |  |  |  |  |

---

# 10. Validation Exit Criteria

Validation is complete when:

- [ ] At least eight student interviews are documented anonymously.
- [ ] At least three organizer interviews are documented anonymously.
- [ ] At least five students attempt the prototype journey.
- [ ] Every High-importance assumption has a recorded result and evidence reference.
- [ ] Contradicting evidence is included rather than discarded.
- [ ] Requirements and the PRD are updated from the findings.
- [ ] The team records which ideas were removed, changed, or deferred.
- [ ] No unnecessary personal data is committed to the repository.

Until these checks are complete, problem statements and workflow descriptions must remain labeled as assumptions rather than confirmed facts.
