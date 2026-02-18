import { gql } from '@apollo/client'

export const PURFENCE_SCHEDULED_TASKS_QUERY = gql`
  query PurfenceScheduledTasks($paging: OffsetPaging, $sorting: [PurfenceScheduledTaskSort!]) {
    purfenceScheduledTasks(paging: $paging, sorting: $sorting) {
      nodes {
        id
        name
        prompt
        kind
        cronExpr
        runAt
        enabled
        nextRunAt
        lastRunAt
        lastStatus
        lastError
        runCount
        slackAppConfigId
        slackChannelId
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const CREATE_PURFENCE_SCHEDULED_TASK_MUTATION = gql`
  mutation CreatePurfenceScheduledTask($input: PurfenceScheduledTaskCreateInput!) {
    createPurfenceScheduledTask(input: $input) {
      id
    }
  }
`

export const UPDATE_PURFENCE_SCHEDULED_TASK_MUTATION = gql`
  mutation UpdatePurfenceScheduledTask($id: ID!, $update: PurfenceScheduledTaskUpdateInput!) {
    updatePurfenceScheduledTask(id: $id, update: $update) {
      id
    }
  }
`

export const DELETE_PURFENCE_SCHEDULED_TASK_MUTATION = gql`
  mutation DeletePurfenceScheduledTask($id: ID!) {
    deletePurfenceScheduledTask(id: $id)
  }
`

export const RUN_PURFENCE_SCHEDULED_TASK_MUTATION = gql`
  mutation RunPurfenceScheduledTask($id: ID!) {
    runPurfenceScheduledTask(id: $id)
  }
`
