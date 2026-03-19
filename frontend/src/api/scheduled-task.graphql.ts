import { gql } from '@apollo/client'

export const SCHEDULED_TASKS_QUERY = gql`
  query ScheduledTasks($paging: OffsetPaging, $sorting: [ScheduledTaskSort!]) {
    scheduledTasks(paging: $paging, sorting: $sorting) {
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

export const CREATE_SCHEDULED_TASK_MUTATION = gql`
  mutation CreateScheduledTask($input: ScheduledTaskCreateInput!) {
    createScheduledTask(input: $input) {
      id
    }
  }
`

export const UPDATE_SCHEDULED_TASK_MUTATION = gql`
  mutation UpdateScheduledTask($id: ID!, $update: ScheduledTaskUpdateInput!) {
    updateScheduledTask(id: $id, update: $update) {
      id
    }
  }
`

export const DELETE_SCHEDULED_TASK_MUTATION = gql`
  mutation DeleteScheduledTask($id: ID!) {
    deleteScheduledTask(id: $id)
  }
`

export const RUN_SCHEDULED_TASK_MUTATION = gql`
  mutation RunScheduledTask($id: ID!) {
    runScheduledTask(id: $id)
  }
`
