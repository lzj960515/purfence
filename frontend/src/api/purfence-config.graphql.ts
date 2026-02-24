import { gql } from '@apollo/client'

export const GET_PURFENCE_CONFIGS = gql`
  query GetPurfenceConfigs {
    purfenceConfigs(paging: { limit: 1, offset: 0 }) {
      totalCount
      nodes {
        id
        projectsRootPath
        proxyUrl
        maxIssueConcurrency
        createdAt
        updatedAt
      }
    }
  }
`

export const CREATE_PURFENCE_CONFIG = gql`
  mutation CreatePurfenceConfig($input: CreateOnePurfenceConfigInput!) {
    createOnePurfenceConfig(input: $input) {
      id
      projectsRootPath
      proxyUrl
      maxIssueConcurrency
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PURFENCE_CONFIG = gql`
  mutation UpdatePurfenceConfig($input: UpdateOnePurfenceConfigInput!) {
    updateOnePurfenceConfig(input: $input) {
      id
      projectsRootPath
      proxyUrl
      maxIssueConcurrency
      createdAt
      updatedAt
    }
  }
`
