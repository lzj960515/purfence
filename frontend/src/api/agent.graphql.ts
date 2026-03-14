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
  mutation CreateAgent($input: CreateOneAgentInput!) {
    createOneAgent(input: $input) {
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

export const UPDATE_AGENT = gql`
  mutation UpdateAgent($input: UpdateOneAgentInput!) {
    updateOneAgent(input: $input) {
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
