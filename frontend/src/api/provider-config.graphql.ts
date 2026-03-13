// GraphQL Schema 定义和查询 - 模型提供商配置
// 使用 nestjs-query 自动生成的 CRUD 操作

import { gql } from '@apollo/client'

// 查询 - 获取所有配置
export const GET_PROVIDER_CONFIGS = gql`
  query GetProviderConfigs {
    modelProviders {
      nodes {
        id
        provider
        name
        baseUrl
        isActive
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

// 查询 - 获取单个配置
export const GET_PROVIDER_CONFIG = gql`
  query GetProviderConfig($id: ID!) {
    modelProvider(id: $id) {
      id
      provider
      name
      baseUrl
      isActive
      createdAt
      updatedAt
    }
  }
`

// 变更 - 创建配置
export const CREATE_PROVIDER_CONFIG = gql`
  mutation CreateProviderConfig($input: CreateOneModelProviderInput!) {
    createOneModelProvider(input: $input) {
      id
      provider
      name
      baseUrl
      isActive
      createdAt
    }
  }
`

// 变更 - 更新配置
export const UPDATE_PROVIDER_CONFIG = gql`
  mutation UpdateProviderConfig($input: UpdateOneModelProviderInput!) {
    updateOneModelProvider(input: $input) {
      id
      provider
      name
      baseUrl
      isActive
      updatedAt
    }
  }
`

// 变更 - 删除配置
export const DELETE_PROVIDER_CONFIG = gql`
  mutation DeleteProviderConfig($input: DeleteOneModelProviderInput!) {
    deleteOneModelProvider(input: $input) {
      id
    }
  }
`
