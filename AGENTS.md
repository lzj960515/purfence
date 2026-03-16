# AGENTS.md

## VERY IMPORTANT

- Use generated GraphQL operations and generated GraphQL hooks for frontend/backend CRUD-style product flows whenever the schema already supports the operation.
- Do not add new RESTful endpoints for flows that can be handled by the existing GraphQL schema.
- For agent conversation management specifically, create/list/delete conversation records must go through GraphQL, not custom REST APIs.
