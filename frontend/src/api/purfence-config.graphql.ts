import { gql } from '@apollo/client'

export const GET_PURFENCE_CONFIG = gql`
  query GetPurfenceConfig($key: String!) {
    purfenceConfigs(filter: { key: { eq: $key } }, paging: { limit: 1 }) {
      nodes {
        id
        key
        value
        createdAt
        updatedAt
      }
    }
  }
`

export const GET_ALL_PURFENCE_CONFIGS = gql`
  query GetAllPurfenceConfigs {
    purfenceConfigs(paging: { limit: 50 }) {
      nodes {
        id
        key
        value
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
      key
      value
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PURFENCE_CONFIG = gql`
  mutation UpdatePurfenceConfig($input: UpdateOnePurfenceConfigInput!) {
    updateOnePurfenceConfig(input: $input) {
      id
      key
      value
      createdAt
      updatedAt
    }
  }
`
