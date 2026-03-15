import { gql } from '@apollo/client'

export const GET_AGENTS = gql`
  query GetAgents {
    agents(
      paging: { offset: 0, limit: 50 }
      sorting: [{ field: updatedAt, direction: DESC }]
    ) {
      nodes {
        id
        name
        instructions
        description
        changeDescription
        tags
        tools
        skills
        modelConfig
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const GET_AGENT_HISTORIES = gql`
  query GetAgentHistories($agentId: String!) {
    agentHistories(
      filter: { agentId: { eq: $agentId } }
      paging: { offset: 0, limit: 50 }
      sorting: [{ field: version, direction: DESC }]
    ) {
      nodes {
        id
        agentId
        version
        name
        instructions
        description
        changeDescription
        tags
        tools
        skills
        modelConfig
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const CREATE_AGENT = gql`
  mutation CreateAgent($input: AgentCreateInput!) {
    createOneAgent(input: { agent: $input }) {
      id
      name
      instructions
      description
      changeDescription
      tags
      tools
      skills
      modelConfig
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_AGENT = gql`
  mutation UpdateAgent($input: UpdateOneAgentInput!) {
    updateOneAgent(input: $input) {
      id
      name
      instructions
      description
      changeDescription
      tags
      tools
      skills
      modelConfig
      createdAt
      updatedAt
    }
  }
`

export const ROLLBACK_AGENT_HISTORY = gql`
  mutation RollbackAgentHistory($agentId: ID!, $historyId: ID!, $changeDescription: String) {
    rollbackAgentHistory(
      agentId: $agentId
      historyId: $historyId
      changeDescription: $changeDescription
    ) {
      id
      name
      instructions
      description
      tags
      tools
      skills
      modelConfig
      createdAt
      updatedAt
    }
  }
`

export const DELETE_AGENT = gql`
  mutation DeleteAgent($input: DeleteOneAgentInput!) {
    deleteOneAgent(input: $input) {
      id
    }
  }
`
