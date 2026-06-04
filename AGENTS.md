# AGENTS.md

Project instructions for AI coding agents working in this repository.

These rules are inspired by the Karpathy-style coding-agent guidelines:
think before coding, keep changes simple, make surgical edits, and work toward verifiable goals.

---

## 1. Default behavior

- Do not assume silently.
- State important assumptions before changing code.
- Ask for clarification only when the task is genuinely ambiguous and guessing may cause damage.
- For small obvious tasks, proceed directly and keep the change minimal.
- Push back if the requested approach is likely to overcomplicate or break the project.
- Prefer the smallest working solution over speculative architecture.

---

## 2. Reasoning level

Use an explicit reasoning level for every task.

- `low` — tiny copy, style, or one-line fixes.
- `mid` — normal UI work, component changes, small features, asset integration.
- `high` — architecture, debugging, data model changes, storage, sync, security, balancing, major refactors.

Default: `mid`.

Use `high` when the task involves:
- debugging;
- architecture;
- game balance;
- local storage / IndexedDB / sync logic;
- financial data;
- authentication or tokens;
- large UI restructuring;
- anything that can break existing flows.

---

## 3. Simplicity first

- Write the minimum code that solves the task.
- Do not add features that were not requested.
- Do not add abstractions for one-time use.
- Do not add configurability unless needed now.
- Do not add new dependencies unless clearly justified.
- If a solution feels clever, simplify it.
- If 200 lines can become 50 without losing clarity, use the simpler version.
- Prefer readable, boring code over smart code.

---

## 4. Surgical changes

- Touch only the files and lines needed for the task.
- Do not refactor unrelated code.
- Do not reformat unrelated files.
- Do not rename things unless the task requires it.
- Do not remove existing comments, TODOs, data, or mock content unless asked.
- Do not delete pre-existing dead code unless asked.
- Remove only unused code created by your own changes.
- Match the existing project style, even if you would personally write it differently.
- Every changed line should be traceable to the user request.

---

## 5. Goal-driven execution

Before implementation, define what success means.

For bugs:
- Reproduce or identify the failure first.
- Fix only the cause of the failure.
- Verify that the failure no longer happens.
- Avoid broad rewrites.

For features:
- State the goal.
- Implement the smallest complete version.
- Verify the user-visible behavior.

For refactors:
- Confirm current behavior before changing it.
- Preserve behavior unless explicitly asked to change it.
- Verify after the refactor.

For multi-step work, use a short plan:
1. Change X.
2. Verify Y.
3. Report result.

---

## 6. Verification checklist

Before finishing, report:

- files changed;
- what was tested;
- what was not tested;
- known risks or assumptions;
- whether lint/typecheck/build passed, if those commands exist.

Prefer running, when available:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

If a command does not exist or cannot run, say so clearly.

---

## 7. UI and UX rules

- Mobile-first, but do not break desktop.
- When fixing mobile layout, preserve desktop layout unless explicitly asked.
- When fixing desktop layout, preserve mobile layout unless explicitly asked.
- Keep UI calm, premium, Apple-like, and readable.
- Use generous spacing, rounded cards, clear hierarchy, and subtle borders.
- Avoid noisy animations.
- Respect reduced motion.
- Red is only for destructive actions, danger, or critical budget states.
- Orange is for warnings.
- Green is for positive / on-track states.
- Do not change global visual language unless explicitly requested.

---

## 8. Finance app rules

Use these rules for the personal/family finance PWA.

Product direction:
- Mobile-first PWA for iPhone and MacBook.
- Deployable on Vercel.
- No Apple Developer account required for MVP.
- Shareable by link.
- Installable through Add to Home Screen.
- Premium dark Apple-like fintech style.
- Calm, clear, not game-like.

MVP storage and sync:
- MVP is local-first.
- No backend database for MVP 0.1.
- Data should stay in browser local storage / IndexedDB unless explicitly changed.
- Use IndexedDB / Dexie-style persistence when building real storage.
- Each family member uses their own device.
- Each family member uses their own monobank token/cards.
- Monobank sync happens when the PWA is opened/active.
- Do not assume guaranteed background sync.

Main tabs:
- Dashboard.
- Transactions.
- Budget.
- Analytics.
- Goals.

Dashboard:
- Month view.
- Current balance, income, expenses.
- Monthly budget with percentage-used progress.
- Highlights / smart insights.
- Two-week calendar view: previous week + current week.
- Calendar can expand into a full month view.
- Mark excessive spending days.

Transactions:
- Add income button.
- Add expense button.
- Add expense opens a popup/bottom sheet with large category icons and prominent amount entry.
- Apple Pay import and receipt scan can appear above manual buttons as future/placeholder actions.
- Transaction list below.

Budget:
- Total monthly budget with progress bar.
- Category spend bars by percentage.

Analytics:
- Donut/circular category infographic.
- Spending trend.
- Monthly anomalies.
- Growth/drop insights.

Goals:
- Large photo-based goal cards.
- Progress bars.
- Horizontal swipe carousel.
- Forecast dates may be added later.

Animation rules:
- MVP 0.1 focuses on layout and clarity.
- Add heavier animation only after the basic product works.
- Use animations sparingly.
- Respect reduced motion.

---

## 9. Game project rules

Use these rules for tower-defense / cat-game work.

- Preserve the core loop unless asked to redesign it.
- Balance changes must be small and measurable.
- Explain balance changes in terms of player experience:
  - difficulty;
  - pacing;
  - readability;
  - touch usability.
- Do not make the first minute too punishing.
- If the player places the first cat, early enemies should reliably appear on that lane unless the task says otherwise.
- Mobile controls must be comfortable.
- Do not solve mobile layout by breaking desktop layout.
- If shrinking the battlefield for mobile, preserve a good desktop layout through responsive rules.

---

## 10. Asset and design rules

- Do not stretch images into wrong aspect ratios.
- Do not crop important subject matter unless asked.
- Use placeholders only when real assets are not available.
- Keep visual consistency across screens.
- Avoid random styles from unrelated apps.
- Do not introduce ethnic, cultural, or contextual stereotypes in generated/selected imagery.
- For Ukrainian war/social-context presentations or apps, use ordinary, context-appropriate visuals.

---

## 11. Dependency rules

- Do not add dependencies by default.
- Reuse existing libraries first.
- If a dependency is necessary, explain:
  - why it is needed;
  - what alternatives were considered;
  - what files changed;
  - whether bundle size or complexity increases.

Preferred UI/UX libraries for the finance app after MVP foundation:
- Recharts for charts.
- Motion / Framer Motion for restrained animations.
- Embla Carousel for swipeable months/goals.
- Vaul / shadcn drawers for bottom sheets.
- Lucide icons.
- Optional Lottie/Rive only for empty or success states.

Do not add these until the task explicitly needs them.

---

## 12. Safety rules for code agents

- Never expose secrets, tokens, keys, or private data.
- Do not commit `.env` files.
- Do not log monobank tokens or financial data.
- Do not send local financial data to a server unless explicitly requested and reviewed.
- Do not add analytics/tracking by default.
- Treat financial data as sensitive.

---

## 13. Final response format

At the end of a coding task, summarize:

```text
Done:
- ...

Changed files:
- ...

Tested:
- ...

Not tested:
- ...

Notes / risks:
- ...
```

Keep the summary short and practical.
