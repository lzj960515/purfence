// GraphQL Schema 定义和查询 - 模型提供商配置
// 使用 nestjs-query 自动生成的 CRUD 操作

import { gql } from '@apollo/client'

// 查询 - 获取所有配置
export const GET_PROVIDER_CONFIGS = gql`
  query GetProviderConfigs {
    modelProviderConfigDtos {
      nodes {
        id
        provider
        name
        email
        baseUrl
        isActive
        isDefault
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
    modelProviderConfigDto(id: $id) {
      id
      provider
      name
      email
      baseUrl
      isActive
      isDefault
      createdAt
      updatedAt
    }
  }
`

// 变更 - 创建配置
export const CREATE_PROVIDER_CONFIG = gql`
  mutation CreateProviderConfig($input: CreateOneModelProviderConfigDtoInput!) {
    createOneModelProviderConfigDto(input: $input) {
      id
      provider
      name
      email
      baseUrl
      isActive
      isDefault
      createdAt
    }
  }
`

// 变更 - 更新配置
export const UPDATE_PROVIDER_CONFIG = gql`
  mutation UpdateProviderConfig($input: UpdateOneModelProviderConfigDtoInput!) {
    updateOneModelProviderConfigDto(input: $input) {
      id
      provider
      name
      email
      baseUrl
      isActive
      isDefault
      updatedAt
    }
  }
`

// 变更 - 删除配置
export const DELETE_PROVIDER_CONFIG = gql`
  mutation DeleteProviderConfig($input: DeleteOneModelProviderConfigDtoInput!) {
    deleteOneModelProviderConfigDto(input: $input) {
      id
    }
  }
`

// 变更 - 切换启用状态 (自定义 mutation)
export const TOGGLE_PROVIDER_ENABLED = gql`
  mutation ToggleProviderEnabled($id: ID!, $isActive: Boolean!) {
    toggleModelProviderConfig(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`
