# Config‑Driven Workflow DSL

This document defines the configuration format (“DSL”) for building and running workflows via **my‑agent** without writing business logic inside `libs/my-agent`.  
Business code is responsible for providing configuration; the my‑agent framework is responsible for interpreting that configuration into an actual VoltAgent workflow and running it.

The same DSL can be used for the weekly competitive‑intel workflow and other workflows later.

---

## 1. Design Goals

- **Business‑only outside, framework‑only inside**
  - `libs/my-agent`: contains the interpreter and engine, but no business SQL or workflow logic.
  - Application code (`src/agent/...`): only fetches and passes configuration (`storeId + workflowKey → config`), then calls the framework.
- **Tool‑centric, reusable steps**
  - Every step is either:
    - A **tool step** (call an existing tool like DB query, web search).
    - An **agent step** (call a model via `andAgent`).
    - Optionally a pure **function step** (simple wiring / aggregation).
  - Same tool can be reused in many steps with different configuration.
- **Simple parameter model**
  - No per‑field mapping from `context` in config; the whole `context` is passed to tools as their options.
  - Parameters are defined per step:
    - `row`: a literal value from config.
    - `step`: a value taken from another step’s output.
- **Loose intermediate schemas**
  - Tools are free to return arbitrary JSON (often an array of rows).
  - The workflow designer (who writes SQL) knows which fields exist.
  - The engine only needs to know how to pass outputs between steps.

---

## 2. Top‑Level WorkflowConfig Shape

A workflow configuration can be stored in JSON, DB, or any config source. Conceptually, it looks like:

- `id`: unique workflow identifier, e.g. `"weekly-competitive-intel"`.
- `name`: human‑readable name.
- `version` (optional): e.g. `"v1"`, `"v2"`.
- `nodes`: list of **nodes**, each wrapping a step definition (tool / agent / function) and graph links.
  Nodes do **not** need to be in execution order; order is determined by `preId` / `nextId`.

Example (conceptual, not final API):

```json
{
  "id": "weekly-competitive-intel",
  "name": "Weekly Competitive Intelligence",
  "version": "v1",
  "nodes": [
    {
      "type": "start",
      "preId": null,
      "nextId": "load-monitored-competitors",
      "node": { "id": "load-monitored-competitors", "type": "tool", "...": "..." }
    },
    {
      "type": "normal",
      "preId": "load-monitored-competitors",
      "nextId": "load-social-posts",
      "node": { "id": "load-social-posts", "type": "tool", "...": "..." }
    },
    {
      "type": "normal",
      "preId": "load-social-posts",
      "nextId": "generate-report",
      "node": { "id": "build-report-input", "type": "function", "...": "..." }
    },
    {
      "type": "end",
      "preId": "build-report-input",
      "nextId": null,
      "node": { "id": "generate-report", "type": "agent", "...": "..." }
    }
  ]
}
```

Application code is expected to:

- Resolve `storeId` and `workflowKey` for the current request.
- Fetch the corresponding `WorkflowConfig` from storage.
- Call into my‑agent with something like:
  - `runWorkflowFromConfig(config, { userId, conversationId, context })`.

---

## 3. Node & Step Config: Common Fields

Each **node** in `nodes` has graph metadata plus an inner **step payload**:

- **Node fields (graph, not business logic)**:
  - `type`:
    - `"start"`: entry node of the workflow (exactly one required).
    - `"end"`: terminal node of the workflow (exactly one required).
    - `"normal"`: intermediate node.
  - `preId`:
    - Id of the previous step in the execution chain (the inner `node.id`).
    - `null` or omitted for the start node.
  - `nextId`:
    - Id of the next step in the execution chain (the inner `node.id`).
    - `null` or omitted for the end node.
  - Together, `type + preId + nextId` define a logical linked list:
    - The engine starts at the unique `start` node.
    - Follows `nextId` until it reaches the unique `end` node.
    - The configuration array order does not matter; the engine reorders and validates the graph (no cycles, no unconnected nodes).

- **Step payload (the actual tool/agent config)**:
  - `id`:
    - Unique within the workflow (e.g. `"load-social-posts"`).
    - Used by the engine and by other steps via `nodeId` references in params.
  - `type`:
    - `"tool"`: call a named tool via `toolService`.
    - `"agent"`: call a model via my‑agent service and `andAgent`.
    - `"function"` (optional for future use): simple transformation step implemented inside the framework.
  - `name` (optional): display name for UIs.
  - `description` (optional): human‑readable explanation for VoltOps / debugging.

The remaining fields depend on the step `type` (tool vs agent vs function).

---

## 4. Parameter Model (`params`)

Most steps need an input object. We build that input from **parameters** defined in the configuration.

### 4.1 Parameter types

Each parameter has:

- `type`:
  - `"literal"`: literal value from config.
  - `"step"`: read from another step’s output.
- Depending on `type`, different fields are valid.

**`literal` parameters**

- Represents a literal piece of data, used as‑is.
- Example uses:
  - SQL string for a DB tool.
  - A constant flag.
  - A small object literal.
- Shape (conceptual):

```json
{
  "type": "literal",
  "value": "SELECT ... FROM ... WHERE storeId = ?"
}
```

**`node` parameters**

- Represents “take a value from the output of another node (step)”.
- Shape:

```json
{
  "type": "node",
  "nodeId": "load-monitored-competitors",
  "value": "rows"
}
```

- Semantics:
  - At runtime the framework will use `getStepData(nodeId)?.output[value]`.
  - If `value` is omitted, it can mean “take the entire `output` object/array`.
  - The config designer decides which step (`nodeId`) and key/path to reference.

### 4.2 Building the input object

For each step, we define a `params` object:

```json
{
  "sql": {
    "type": "literal",
    "value": "SELECT DISTINCT hashTag FROM p_social_analysis_cleaning_topic WHERE storeId = ? AND topicType IN ('account_to_monitor', 'ACCOUNT_TO_MONITOR_INSTAGRAM')"
  },
  "competitors": {
    "type": "node",
    "nodeId": "load-monitored-competitors",
    "value": "rows"
  }
}
```

At runtime, the framework will:

- Iterate over each entry in `params`.
- For `"literal"`:
  - Use `value` directly.
- For `"node"`:
  - Resolve `getStepData(nodeId)?.output[value]` (or full `output` if `value` missing).
- Build the final `input` object for the step’s tool/agent as:

```json
{
  "sql": "SELECT DISTINCT ...",
  "competitors": [ /* resolved rows from previous step */ ]
}
```

All parameters are **independent of `state.context`**: tools get `context` separately via options.

---

## 5. Tool Steps

Tool steps call existing tools registered in the system. The config defines **which tool** to call and **how to construct its input**.

### 5.1 Shape

Conceptually, a tool step looks like:

```json
{
  "id": "load-social-posts",
  "type": "tool",
  "name": "Load Social Posts",
  "description": "Fetch posts and metrics for monitored competitors.",
  "toolName": "querySocialMediaAnalysisDatabase",
  "params": {
    "sql": {
      "type": "literal",
      "value": "SELECT ... FROM p_social_analysis_cleaning_post WHERE storeId = ? AND hashTag IN (...)"
    },
    "competitors": {
      "type": "node",
      "nodeId": "load-monitored-competitors",
      "value": "rows"
    }
  }
}
```

### 5.2 Execution semantics

When the framework interprets a tool step:

- It uses `toolName` to resolve the tool instance from `toolService`.
- It builds the tool input from `params` as described above.
- It calls the tool with two arguments:
  - `input`: the object built from `params`.
  - `options`: containing the full workflow `state`:
    - `userId`
    - `conversationId`
    - `context` (a `Map` or equivalent)
- Tools are responsible for reading any needed values from `options.context`:
  - Example: `storeId`, date range, feature flags.
- The tool returns arbitrary JSON (often an array of rows). The framework:
  - Records this as `output` for the step.
  - Makes it available via `getStepData(nodeId).output` to later steps.

Intermediate schemas are not enforced by the DSL; the workflow designer who writes the SQL knows which fields are available.

---

### 5.3 Example: Building SQL via `jsCodeExecutor` then querying `queryShopifyOrderDatabase`

Some tools (like `queryShopifyOrderDatabase`) accept only a single `query` string as input, and rely on `options.context` for parameters like `storeV1Id`.  
To support dynamic WHERE conditions (time ranges, IN lists, etc.) without changing these tools, we can use the `jsCodeExecutor` tool as a “SQL builder” step.

**Step 1: Build the SQL string**

```json
{
  "id": "build-order-query",
  "type": "tool",
  "name": "Build Order SQL",
  "toolName": "jsCodeExecutor",
  "params": {
    "code": {
      "type": "literal",
      "value": "const { startDate, endDate } = params;\nconst sql = `\n  SELECT *\n  FROM bi_shopify_trans_order o\n  WHERE o.\"storeV1Id\" = $1\n    AND o.\"processedAt\" >= '${startDate}'::timestamp\n    AND o.\"processedAt\" < '${endDate}'::timestamp\n`;\nreturn { query: sql };"
    },
    "params": {
      "type": "node",
      "nodeId": "compute-date-range",
      "value": "result"
    }
  }
}
```

Notes:
- `toolName: "jsCodeExecutor"` refers to the general‑purpose JS code tool.
- It receives:
  - `code`: the JavaScript snippet to run.
  - `params`: a JSON object from a previous step (here, the `compute-date-range` step’s `output.result`), which could contain `{ startDate, endDate }`.
- The code returns `{ query }`, which becomes `getStepData("build-order-query").output.result.query`.

**Step 2: Execute the SQL against Shopify BI database**

```json
{
  "id": "run-order-query",
  "type": "tool",
  "name": "Run Order Query",
  "toolName": "queryShopifyOrderDatabase",
  "params": {
    "query": {
      "type": "node",
      "nodeId": "build-order-query",
      "value": "result.query"
    }
  }
}
```

In this step:

- `toolName: "queryShopifyOrderDatabase"` uses the existing BI query tool.
- It receives a single `query` string produced by the previous `jsCodeExecutor` step.
- Inside the tool implementation:
  - `$1` is bound to `options.context.get('storeV1Id')`.
  - The dynamic time range is already baked into the SQL literal.

This pattern allows:

- Keeping legacy tools (single `query` parameter) unchanged.
- Expressing complex, dynamic SQL construction in a dedicated step using `jsCodeExecutor`.
- Composing multiple data sources or previous step outputs into a single SQL string before execution.

### 5.4 Common mistakes to avoid when authoring configs (especially by AI tools)

- **Do NOT invent fake tools like `"start"` or `"end"`**:
  - The first real step (e.g. `currentDateTime`) should be wrapped in a node with `type: "start"`.
  - The last real step should be wrapped in a node with `type: "end"`.
  - `toolName` must always be a real, registered tool (e.g. `"currentDateTime"`, `"jsCodeExecutor"`, `"queryShopifyOrderDatabase"`, `"web-search"`), never `"start"` / `"end"` / `"noop"` etc.
- **Prefer `jsCodeExecutor` when SQL must depend on previous step outputs**:
  - If a query needs dynamic time ranges or IN lists that are computed from previous step results (for example a list of competitors), compute those pieces in a `jsCodeExecutor` node and only pass the final SQL string into the DB tool.
  - Keep DB tool `query` params as:
    - `type: "node"`
    - `nodeId`: id of the `jsCodeExecutor` node
    - `value: "result.query"`
  - If the database’s own functions are sufficient and the SQL does *not* need values from previous steps (for example simple `CURRENT_DATE - INTERVAL '3 months'` ranges), it is OK to write the SQL directly as a literal without an intermediate `jsCodeExecutor` step.
- **Respect the node graph rules**:
  - Exactly 1 `"start"` and 1 `"end"` node.
  - `preId` / `nextId` must form a single chain; do not leave nodes unconnected.
  - `node.id` values must be unique across the workflow.

## 6. Agent Steps

Agent steps call models via my‑agent, using `andAgent` under the hood.

### 6.1 Shape

Conceptually, an agent step contains:

- `id`, `type: "agent"`.
- Agent configuration:
  - `model`: e.g. `"gpt-5-mini"`.
  - `prompt`: system/role prompt for this agent node.
  - `name` (optional): agent name for logging.
- `params`:
  - How to construct the “data” object passed to `andAgent` from previous steps.
- Schema:
  - A reference to a known schema key or type (implementation detail in my‑agent).

Example (conceptual):

```json
{
  "id": "generate-report",
  "type": "agent",
  "name": "Generate Weekly Report",
  "agent": {
    "model": "gpt-5-mini",
    "prompt": "You are an expert marketing analyst who writes weekly competitive intelligence summaries."
  },
  "params": {
    "competitors": {
      "type": "node",
      "nodeId": "build-report-input",
      "key": "competitors"
    }
  },
  "schemaKey": "weeklyCompetitiveIntelReport"
}
```

### 6.2 Execution semantics

When interpreting an agent step, the framework will:

- Create or obtain an agent via `MyAgentService` using the `agent` configuration:
  - `model`, `prompt`, and optional `name`.
- Build the `data` object for `andAgent` from `params` and `getStepData`, same as tool steps.
- Call `andAgent` with:
  - A prompt builder that uses `data` to create the final user prompt.
  - The agent instance.
  - The schema associated with `schemaKey` to enforce structured output.
- The resulting JSON is recorded as this step’s `output`, and becomes available to subsequent steps or as the workflow’s final result.

For the weekly competitive‑intel workflow, the agent step is expected to output something like:

- `{ "reportMarkdown": "..." }`

which the caller can store or send back into a conversation.

---

## 7. Function Steps (Optional)

Function steps are pure transformations that do not call tools or agents.

### 7.1 Shape

Early versions of the DSL can keep this simple; function steps can be:

- Predefined functions inside the framework, referenced by name.
- Operate only on previous step outputs and return a derived object.

Example (conceptual):

```json
{
  "id": "build-report-input",
  "type": "function",
  "name": "Build Report Input",
  "functionName": "aggregateCompetitiveData",
  "params": {
    "competitorsRows": {
      "type": "node",
      "nodeId": "load-monitored-competitors",
      "value": "rows"
    },
    "postsRows": {
      "type": "node",
      "nodeId": "load-social-posts",
      "value": "rows"
    }
  }
}
```

The specific implementation of `aggregateCompetitiveData` lives in the framework and knows how to group, filter, and assemble a clean `competitors` array for the agent step.

Function steps are not mandatory for the first version of the DSL; simple workflows can jump directly from tool outputs to the agent step.

---

## 8. Workflow Execution Flow

Given a `WorkflowConfig` and a `state`:

1. Application layer:
   - Computes `state` (`userId`, `conversationId`, `context` with `storeId`, etc.).
   - Fetches config for `(storeId, workflowKey)`.
   - Calls the my‑agent framework with config and state.
2. my‑agent framework:
   - Interprets the config and builds a `createWorkflowChain` chain.
   - For each step:
     - Resolves tools/agents (via `toolName` / `agent` config).
     - Builds input from `params` and previous `step` outputs.
     - Passes full `state` / `context` to tools via options.
   - Runs the workflow:
     - Executes steps in order (and later possibly with conditions / branches).
     - Records each step’s `output` for `getStepData`.
   - Returns the final result (usually the last step’s `output`) to the caller.

With this DSL in place, business code only needs to maintain configuration (what steps, which tools, which params), while my‑agent takes care of running the workflow in a consistent, observable way.
