# Project agent delegation

- Before starting a substantial task, decide whether specialist input would materially improve the result. If the task needs that expertise or independent review, delegate proactively without waiting for the user to ask.
- Use the project subagents in `.opencode/agents/` where they fit: `design` for visual direction and UX, `frontend` for UI implementation and accessibility, `backend` for APIs and external integrations, and `testing` for test strategy and coverage.
- Launch independent reviews in parallel. Give each subagent a focused task, relevant repository context, and clear constraints; explicitly say when work must be inspection-only.
- Keep trivial or tightly scoped edits with the primary agent when delegation would add overhead or no independent value.
- The primary agent remains responsible for coordinating work, reconciling findings, verifying the final result, and reporting which subagents were used. Never claim a subagent was used if it was not.
