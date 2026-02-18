import { gql } from '@apollo/client'

export const GET_APP_CONFIGS = gql`
  query GetAppConfigs {
    purfenceAppConfigs {
      nodes {
        id
        name
        type
        enabled
        config
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const CREATE_APP_CONFIG = gql`
  mutation CreateAppConfig($input: CreateOnePurfenceAppConfigInput!) {
    createOnePurfenceAppConfig(input: $input) {
      id
      name
      type
      enabled
      config
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_APP_CONFIG = gql`
  mutation UpdateAppConfig($input: UpdateOnePurfenceAppConfigInput!) {
    updateOnePurfenceAppConfig(input: $input) {
      id
      name
      type
      enabled
      config
      createdAt
      updatedAt
    }
  }
`

export const DELETE_APP_CONFIG = gql`
  mutation DeleteAppConfig($input: DeleteOnePurfenceAppConfigInput!) {
    deleteOnePurfenceAppConfig(input: $input) {
      id
    }
  }
`
