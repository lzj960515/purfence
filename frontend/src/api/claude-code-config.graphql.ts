import { gql } from '@apollo/client'

export const GET_CLAUDE_CODE_CONFIGS = gql`
  query GetClaudeCodeConfigs {
    claudeCodeConfigs(paging: { limit: 1, offset: 0 }) {
      totalCount
      nodes {
        id
        useDefaultConfig
        modelProviderId
        env {
          key
          value
        }
        createdAt
        updatedAt
      }
    }
  }
`

export const CREATE_CLAUDE_CODE_CONFIG = gql`
  mutation CreateClaudeCodeConfig($input: CreateOneClaudeCodeConfigInput!) {
    createOneClaudeCodeConfig(input: $input) {
      id
      useDefaultConfig
      modelProviderId
      env {
        key
        value
      }
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_CLAUDE_CODE_CONFIG = gql`
  mutation UpdateClaudeCodeConfig($input: UpdateOneClaudeCodeConfigInput!) {
    updateOneClaudeCodeConfig(input: $input) {
      id
      useDefaultConfig
      modelProviderId
      env {
        key
        value
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_PROVIDER_OPTIONS_FOR_CLAUDE = gql`
  query GetProviderOptionsForClaude {
    modelProviderConfigDtos {
      nodes {
        id
        name
        provider
        isActive
      }
    }
  }
`
