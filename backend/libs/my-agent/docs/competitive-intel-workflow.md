# Tool-Driven Competitive Intelligence Workflow Design

This document describes how to turn the “weekly competitive intelligence report” use case into a **reusable, tool‑driven VoltAgent workflow**, with the middle steps fully controlled by us (SQL, tools, data flow), and the AI only used at the very end to produce a natural‑language report.

The design here is generic and can be reused for other similar workflows later.

---

## 1. Goals & Constraints

- Avoid letting the model “freestyle SQL” in the middle of a task.
- Make the data‑gathering pipeline deterministic and debuggable.
- Keep workflows **reusable and generic**:
  - Steps are built from existing tools (e.g. DB query, web search, etc.).
  - The same tool can be reused across many steps with different inputs.
- Do **not** hardcode detailed intermediate schemas:
  - A DB query step’s output is treated as “array of objects”.
  - The person who writes the SQL knows which fields are available.
- Use `workflow.run(input, state)` with the same state model as agents:
  - `userId`, `conversationId`, `context: Map<string, any>`.
  - Business parameters are taken from `state` or tools, not from `input`.
- Use `getStepData(nodeId)` to read previous step outputs, instead of stuffing data into `state.context`.

---

## 2. High‑Level Architecture

**Key pieces**
- **VoltAgent**: agent runtime, also responsible for registering workflows so they are visible in VoltOps / dashboards.
- **Workflow engine**: built with `createWorkflowChain`, responsible for:
  - Step sequencing (andThen / andAgent / andWhen / etc.).
  - Capturing each step’s input/output so later steps can use `getStepData`.
  - Emitting telemetry for VoltOps (step timing, success/failure).
- **Tools**: existing callable tools (DB query, web search, etc.) exposed via NestJS/MCP and injected into steps.
- **Persistence (optional)**: `PostgresStorage` for workflow run history.

**Execution model**
- The app calls:
  - `workflow.run(input, { userId, conversationId, context })`
- `input` is usually trivial for these workflows (often unused or very small).
- `state` carries:
  - `userId` / `conversationId` for tracing, access control, and logging.
  - `context` with stable parameters (e.g. `storeId`, date range, feature flags).
- When a tool runs, it always receives the full `state` / `context` via its options, so it can read things like `storeId` directly without extra configuration.
- Each step:
  - Receives `{ data, state, getStepData }`.
  - Returns an output object (which is recorded by the engine).
  - Later steps read earlier outputs via `getStepData('step-id')`.

---

## 3. State vs Step Outputs

We distinguish two concepts:

1. **State (ambient context)**
   - Comes from the caller of `workflow.run`.
   - Examples:
     - `userId`, `conversationId`
     - `storeId`
     - time window (e.g. last 7 days)
     - feature flags like `"plan": "premium"`
   - Typically used for:
     - Access control decisions.
     - Being read directly by tools when they execute (e.g. `storeId` from context).
     - Cross‑cutting behaviour (e.g. `plan` → permissions).
   - We try **not** to use `state.context` to pass large intermediate result sets between steps.

2. **Step outputs (data flow)**
   - Every step returns an `output` value.
   - The engine records this under the step’s `id`.
   - Later steps use `getStepData(nodeId)` to access:
     - The input that step saw.
     - The output it produced.
   - This is the main mechanism for chaining DB results, analysis results, etc.

**Convention for our workflows**
- Use `state.context` only for:
  - Initial parameters that don’t come from the model (e.g. `storeId`).
  - Global flags/configuration.
- Use step outputs + `getStepData` for:
  - All intermediate query results.
  - Derived aggregates.
  - Data that feeds into the AI summarisation step.

This keeps `context` small and makes it easy to inspect each step’s data in VoltOps.

---

## 4. Tool‑Driven Step Model

We treat each step as one of three categories:

1. **Tool step**  
   Calls an existing tool (e.g. DB query, social media analytics, web search).

   Properties:
   - `id`: unique step ID (e.g. `load-monitored-competitors`).
   - **Tool reference**:
     - A NestJS‑injected service or MCP tool, e.g. `querySocialMediaAnalysisDatabase`, `webSearch`, `currentDateTime`.
   - **Static configuration**:
     - Tool‑specific payload, usually written once by the workflow designer.
     - Typical examples:
       - SQL text for DB queries.
       - Web search query template.
   - **Dynamic parameter mapping**:
     - Uses a simple parameter model to build the tool input from configuration and previous step outputs.
     - The workflow config does **not** map individual fields from `state.context`; the entire context is passed to the tool via options and the tool reads what it needs.
   - **Output**:
     - We treat DB query results as `Array<Record<string, any>>`.
     - No strict Zod schema for fields; the SQL writer knows what columns are present.
     - The output is returned from the step and later read via `getStepData`.

   **Parameter model**
   - Each tool step defines a set of parameters for its input.
   - For each parameter we only need:
     - A **type**: for example `"literal"` or `"step"`.
     - A **value** or a reference, depending on the type.
   - Typical cases:
     - `literal`:
       - The value is used as‑is when building the tool input (e.g. a fixed SQL string, a constant flag).
     - `step`:
       - The parameter’s value is taken from another step’s output.
       - The config specifies:
         - `nodeId`: which step (node) to read from.
         - `value`: which key (or path) inside that step’s `output` to use.
       - At runtime, the framework uses `getStepData(nodeId)?.output[value]` (or the whole `output` if `value` is omitted) when constructing the tool input.
   - This keeps the parameter resolution logic generic: the framework only needs to understand param `type`, `nodeId`, and `value` to assemble the input object for any tool.

2. **Agent step**  
   Calls an AI model **only for summarisation / report generation**, not for data fetching or SQL generation.

   Properties:
   - `id`: e.g. `generate-report`.
   - Uses a VoltAgent instance (e.g. `gpt-5-mini`) with a clear prompt.
   - Input to the model:
     - Structured JSON assembled from previous steps:
       - Competitor list.
       - Top posts / metrics.
       - Promo/pricing info.
       - Ads activity.
       - News snippets.
   - Output:
     - Strongly typed with Zod at the workflow `result` level.
     - For this workflow we expect `{ reportMarkdown: string }`.
   - Prompt is designed to:
     - Never call tools.
     - Use only the provided JSON.
     - Produce a consistent sectioned report.

3. **Pure function step**  
   A light transformation without tools or AI.

   Examples:
   - Combine multiple prior step outputs into a single object.
   - Sort/filter/aggregate query results.
   - Apply simple business rules before giving data to the AI.

---

## 5. Concrete Workflow: Weekly Competitive Intel

The “weekly competitive intelligence summary” workflow can be implemented as a chain of reusable, tool‑driven steps.

### 5.1 Workflow metadata

- `id`: `weekly-competitive-intel`
- `name`: e.g. `Weekly Competitive Intelligence`
- `input`:
  - Minimal or `unknown`, since we mainly use `state` and tools.
- `result`:
  - A Zod schema with the final report:
    - `reportMarkdown: string`

### 5.2 Steps overview

Suggested step sequence:

1. **`load-monitored-competitors`**  
   - Type: tool step (DB).
   - Tool: social media analysis DB query tool (same one used in the successful conversation).
   - Purpose:
     - Load the list of monitored competitor accounts for the current `storeId`.
   - Input:
     - SQL like:  
       “SELECT DISTINCT hashTag FROM p_social_analysis_cleaning_topic WHERE storeId = ? AND topicType IN ('account_to_monitor', 'ACCOUNT_TO_MONITOR_INSTAGRAM')”
     - `storeId` from `state.context` or another agreed source in `state`.
   - Output:
     - An array of rows, each with fields like `hashTag`.
     - Accessible later as: `getStepData('load-monitored-competitors').output`.

2. **`load-social-posts`**  
   - Type: tool step (DB).
   - Tool: same DB query tool.
   - Purpose:
     - Fetch posts, engagement metrics, EMV, etc. for the monitored competitors over the time window (e.g. last 7 days).
   - Input:
     - SQL text defined by the workflow designer (the long query that selects posts, engagement, EMV, etc.).
     - Uses competitor handles from `load-monitored-competitors` when building `IN (...)` or parameters.
     - Uses date range from `state.context` if needed.
   - Output:
     - Array of post rows with fields like `hashTag`, `platform`, `description`, `total_engagement`, `emv`, `post_date`, etc.
     - Accessible via `getStepData('load-social-posts').output`.

3. **`load-ads-activity`** (optional, if data source exists)  
   - Type: tool step (DB or ads API).
   - Purpose:
     - Load ad counts and creatives for the same competitors.
   - Input:
     - Tool payload built from competitor list and date range.
   - Output:
     - Array of rows with ad statistics.
     - Accessible via `getStepData('load-ads-activity').output`.

4. **`load-promos-and-pricing`** (optional)  
   - Type: tool step (DB or scraper).
   - Purpose:
     - Fetch current promotions and pricing changes from the relevant data source.
   - Input:
     - Query built from competitor identifiers and date range.
   - Output:
     - Array of promo/pricing rows.
     - Accessible via `getStepData('load-promos-and-pricing').output`.

5. **`load-news`** (optional)  
   - Type: tool step (web search).
   - Tool: web search or news search tool.
   - Purpose:
     - Retrieve recent news headlines and articles for each brand (last 7 days).
   - Input:
     - Query templates that interpolate competitor names or handles.
   - Output:
     - Array of news items per competitor (title, URL, snippet, published date, etc.).
     - Accessible via `getStepData('load-news').output`.

6. **`build-report-input`**  
   - Type: pure function step.
   - Purpose:
     - Merge the various arrays from previous tool steps into a single structured object per competitor.
   - Behaviour:
     - Reads previous outputs via `getStepData`:
       - `load-monitored-competitors`
       - `load-social-posts`
       - `load-ads-activity` (optional)
       - `load-promos-and-pricing` (optional)
       - `load-news` (optional)
     - Groups and aggregates the data into a structure like:
       - `competitors: [{ handle, topPosts, promos, ads, news }, ...]`
     - Applies simple rules:
       - Limit number of posts per brand.
       - Filter out low‑signal data if needed.
   - Output:
     - A single “analysis input” object ready for the AI step.
     - Accessible via `getStepData('build-report-input').output`.

7. **`generate-report`**  
   - Type: agent step.
   - Purpose:
     - Turn the structured analysis data into a user‑facing weekly report.
   - Input:
     - Structured JSON from `build-report-input`.
     - Optional context: overall date range, `storeId`, etc.
   - Prompt design:
     - Explain exactly which fields are available.
     - Forbid calling tools; summarise only given data.
     - Ask for a concise report with:
       - One section per competitor.
       - Highlights of top performing creatives.
       - New products/features.
       - Promos/pricing.
       - Social sentiment with quotes.
       - A “3 ideas to steal” section at the end.
   - Output:
     - `{ reportMarkdown: string }`, which is the workflow result.

---

## 6. Reuse & Extensibility

This design is intentionally generic:

- **Tools are reusable**  
  - The same DB tool can be used across many workflows and steps.
  - Steps differ only by:
    - Their SQL text or tool payload.
    - How they read previous outputs with `getStepData`.

- **Minimal coupling to business schemas**  
  - The engine doesn’t need to know every column a query returns.
  - The workflow designer writes SQL and knows which fields are available.
  - Only the final AI output is strongly typed, so consumers know what they get.

- **Future UI configuration**  
  - A UI can render the workflow as a graph of nodes.
  - Each node can be configured with:
    - Step `id` and name.
    - Tool selection.
    - Static payload (SQL / query template).
    - References to previous steps’ outputs (via step IDs) for dynamic input.
  - On the backend, that configuration can be turned into a `createWorkflowChain` definition.

- **Versioning**  
  - Use versioned workflow IDs like `weekly-competitive-intel:v1`.
  - New versions can be released without breaking existing callers.

---

## 7. Error Handling & Observability

**Error behaviour**
- Each step should fail fast if:
  - The tool returns an error (SQL error, network error, etc.).
  - Required previous outputs are missing (`getStepData` returns undefined).
- Clear step IDs and names are important so VoltOps can show where a run failed.

**Logging**
- Inside steps, log human‑readable summaries, for example:
  - “Found 9 monitored competitors for store 123.”
  - “Loaded 320 posts for @rarebeauty in the last 7 days.”
  - “News search disabled by config.”
- This makes it easier to inspect individual runs from the dashboard.

**History storage**
- For production, configure workflow memory with `PostgresStorage` so:
  - Each run’s steps, inputs, outputs, and errors are persisted.
  - VoltOps can display historical runs and their step‑by‑step data.

---

## 8. Triggering the Workflow

Typical trigger patterns:

1. **From a conversation**  
   - The agent detects that the user is asking for a weekly competitive report.
   - Backend calls `workflow.run` with:
     - `userId` and `conversationId` from the current session.
     - `context` including `storeId`, date range, and any feature flags.
   - When the workflow finishes:
     - The `reportMarkdown` is posted back into the conversation as an assistant message.

2. **From a scheduled job**  
   - A cron/queue job runs the workflow periodically (e.g. every Monday).
   - The result can be:
     - Saved into a reports table.
     - E‑mailed or pushed as a notification.
     - Later referenced inside conversations.

Both patterns reuse the same workflow definition. The only difference is how `state` is constructed and what is done with the `reportMarkdown` at the end.
