import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_AGENT,
  DELETE_AGENT,
  GET_AGENTS,
  UPDATE_AGENT,
} from '@/api/agent.graphql'

export type AgentModelRoute = {
  id: string
  model: string
}

export type AgentModelConfig = {
  default: AgentModelRoute
  fallbacks: AgentModelRoute[]
}

export interface AgentItem {
  id: string
  name: string
  instructions?: string
  description?: string
  changeDescription?: string
  parentId?: string
  global: boolean
  tools?: string[]
  skills?: string[]
  modelConfig?: AgentModelConfig
  createdAt: string
  updatedAt: string
}

export interface AgentInput {
  name: string
  instructions?: string
  description?: string
  changeDescription?: string
  parentId?: string | null
  global: boolean
  tools?: string[]
  skills?: string[]
  modelConfig?: AgentModelConfig
}

type AgentMutationInput = {
  name?: string | null
  instructions?: string | null
  description?: string | null
  changeDescription?: string | null
  parentId?: string | null
  global?: boolean
  tools?: string[] | null
  skills?: string[] | null
  modelConfig?: AgentModelConfig | null
}

type AgentNode = {
  id: string
  name?: string | null
  instructions?: string | null
  description?: string | null
  changeDescription?: string | null
  parentId?: string | null
  global?: boolean | null
  tools?: unknown
  skills?: unknown
  modelConfig?: unknown
  createdAt: string
  updatedAt: string
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? normalized : undefined
}

function isModelRoute(value: unknown): value is AgentModelRoute {
  return !!value && typeof value === 'object' && 'id' in value && 'model' in value
}

function toModelConfig(value: unknown): AgentModelConfig | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const candidate = value as {
    default?: unknown
    fallbacks?: unknown
  }

  if (!isModelRoute(candidate.default)) {
    return undefined
  }

  const fallbacks = Array.isArray(candidate.fallbacks)
    ? candidate.fallbacks.filter(isModelRoute)
    : []

  return {
    default: {
      id: candidate.default.id,
      model: candidate.default.model,
    },
    fallbacks: fallbacks.map((item) => ({ id: item.id, model: item.model })),
  }
}

function mapFromGraphQL(node: AgentNode): AgentItem {
  return {
    id: node.id,
    name: String(node.name || ''),
    instructions: node.instructions || undefined,
    description: node.description || undefined,
    changeDescription: node.changeDescription || undefined,
    parentId: node.parentId?.trim() || undefined,
    global: node.global === true,
    tools: toStringArray(node.tools),
    skills: toStringArray(node.skills),
    modelConfig: toModelConfig(node.modelConfig),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

function hasOwnField<T extends object>(value: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function normalizeInput(
  input: AgentMutationInput,
  mode: 'create' | 'update',
): AgentMutationInput {
  const normalized: AgentMutationInput = {}

  if (hasOwnField(input, 'name')) {
    normalized.name = input.name?.trim() ?? (mode === 'update' ? null : undefined)
  }

  if (hasOwnField(input, 'instructions')) {
    const instructions = input.instructions?.trim() ?? ''
    normalized.instructions = instructions || (mode === 'update' ? null : undefined)
  }

  if (hasOwnField(input, 'description')) {
    const description = input.description?.trim() ?? ''
    normalized.description = description || (mode === 'update' ? null : undefined)
  }

  if (hasOwnField(input, 'changeDescription')) {
    const changeDescription = input.changeDescription?.trim() ?? ''
    normalized.changeDescription =
      changeDescription || (mode === 'update' ? null : undefined)
  }

  const normalizeList = (items: string[] | null | undefined) => {
    const next = items?.map((item) => item.trim()).filter(Boolean) ?? []
    if (next.length > 0) {
      return next
    }
    return mode === 'update' ? [] : undefined
  }

  if (hasOwnField(input, 'parentId')) {
    const parentId = input.parentId?.trim() ?? ''
    normalized.parentId = parentId || (mode === 'update' ? null : undefined)
  }

  if (hasOwnField(input, 'global')) {
    normalized.global = input.global ?? false
  }

  if (hasOwnField(input, 'tools')) {
    normalized.tools = normalizeList(input.tools)
  }

  if (hasOwnField(input, 'skills')) {
    normalized.skills = normalizeList(input.skills)
  }

  if (hasOwnField(input, 'modelConfig')) {
    const defaultId = input.modelConfig?.default.id?.trim() ?? ''
    const defaultModel = input.modelConfig?.default.model?.trim() ?? ''

    normalized.modelConfig =
      defaultId && defaultModel
        ? {
            default: {
              id: defaultId,
              model: defaultModel,
            },
            fallbacks: (input.modelConfig?.fallbacks || [])
              .map((item) => ({
                id: item.id.trim(),
                model: item.model.trim(),
              }))
              .filter((item) => item.id && item.model),
          }
        : mode === 'update'
          ? null
          : undefined
  }

  return normalized
}

export function useAgents() {
  const [items, setItems] = useState<AgentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { data, refetch } = useQuery(GET_AGENTS, {
    fetchPolicy: 'network-only',
  })

  const [createMutation] = useMutation(CREATE_AGENT)
  const [updateMutation] = useMutation(UPDATE_AGENT)
  const [deleteMutation] = useMutation(DELETE_AGENT)

  useEffect(() => {
    if (!data?.agents) return
    setItems(data.agents.nodes.map((node: AgentNode) => mapFromGraphQL(node)))
    setLoading(false)
  }, [data])

  const createItem = async (input: AgentInput) => {
    setError(null)
    const result = await createMutation({
      variables: {
        input: {
          agent: normalizeInput(input, 'create'),
        },
      },
    })

    const created = result.data?.createOneAgent as AgentNode | undefined
    if (!created) {
      throw new Error('创建 Agent 失败')
    }

    const mapped = mapFromGraphQL(created)
    setItems((prev) => [mapped, ...prev])
    return mapped
  }

  const updateItem = async (
    id: string,
    updates: Partial<AgentInput>,
  ) => {
    setError(null)
    const result = await updateMutation({
      variables: {
        input: {
          id,
          update: normalizeInput(updates, 'update'),
        },
      },
    })

    const updated = result.data?.updateOneAgent as AgentNode | undefined
    if (!updated) {
      throw new Error('更新 Agent 失败')
    }

    const mapped = mapFromGraphQL(updated)
    setItems((prev) => prev.map((item) => (item.id === id ? mapped : item)))
    return mapped
  }

  const deleteItem = async (id: string) => {
    setError(null)
    await deleteMutation({
      variables: {
        input: { id },
      },
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const refetchItems = async () => {
    setLoading(true)
    try {
      const result = await refetch()
      if (result.data?.agents?.nodes) {
        const nextItems = result.data.agents.nodes.map((node: AgentNode) => mapFromGraphQL(node))
        setItems(nextItems)
        return nextItems
      }
      return items
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('刷新 Agent 列表失败')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetchItems,
  }
}
