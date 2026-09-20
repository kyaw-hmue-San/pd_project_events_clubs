Act as an adversarial architecture tester.

Architecture under test:

[Architecture]

Requirements and business rules:

[Requirements]

Identify scenarios where the system could fail,
lose data, expose data, allow unauthorized access,
or produce inconsistent results.

Focus especially on:

- simultaneous requests
- invalid inputs
- duplicate operations
- permissions
- network failure
- database failure
- third-party API failure

Do not redesign the architecture yet.

List the weaknesses first.

For each weakness provide:

- Scenario
- Expected invariant
- How the system could fail
- Impact
- Likelihood
- Severity: Critical / High / Medium / Low
- Evidence or assumption
- Recommended test

After listing the weaknesses, provide a separate mitigation section.
