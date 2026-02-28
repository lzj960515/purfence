import { gql } from '@apollo/client'

export const MY_QUEUES_QUERY = gql`
  query MyQueues(
    $paging: OffsetPaging!
    $filter: MyQueueFilter!
    $sorting: [MyQueueSort!]!
  ) {
    myQueues(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        name
        maxConcurrency
        attempts
        isPaused
      }
      totalCount
    }
  }
`

export const MY_QUEUE_JOBS_QUERY = gql`
  query MyQueueJobs(
    $paging: OffsetPaging!
    $filter: MyQueueJobFilter!
    $sorting: [MyQueueJobSort!]!
  ) {
    myQueueJobs(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        queueId
        queueName
        data
        status
        availableAt
        attempts
        runCount
        errorMessage
        createdAt
        updatedAt
        runningAt
        completedAt
      }
      totalCount
    }
  }
`

export const MY_QUEUE_STATS_QUERY = gql`
  query MyQueueStats($queueId: String!) {
    total: myQueueJobs(
      paging: { offset: 0, limit: 1 }
      filter: { queueId: { eq: $queueId } }
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
    }
    pending: myQueueJobs(
      paging: { offset: 0, limit: 1 }
      filter: { queueId: { eq: $queueId }, status: { eq: pending } }
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
    }
    running: myQueueJobs(
      paging: { offset: 0, limit: 1 }
      filter: { queueId: { eq: $queueId }, status: { eq: running } }
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
    }
    succeeded: myQueueJobs(
      paging: { offset: 0, limit: 1 }
      filter: { queueId: { eq: $queueId }, status: { eq: succeeded } }
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
    }
    failed: myQueueJobs(
      paging: { offset: 0, limit: 1 }
      filter: { queueId: { eq: $queueId }, status: { eq: failed } }
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
    }
  }
`

export const UPDATE_MY_QUEUE_MUTATION = gql`
  mutation UpdateMyQueue($input: UpdateOneMyQueueInput!) {
    updateOneMyQueue(input: $input) {
      id
      name
      maxConcurrency
      attempts
      isPaused
    }
  }
`

export const CREATE_MY_QUEUE_JOB_MUTATION = gql`
  mutation CreateMyQueueJob($input: CreateOneMyQueueJobInput!) {
    createOneMyQueueJob(input: $input) {
      id
      queueId
      queueName
      status
      availableAt
      attempts
      runCount
      errorMessage
      createdAt
    }
  }
`

export const DELETE_MY_QUEUE_JOB_MUTATION = gql`
  mutation DeleteMyQueueJob($input: DeleteOneMyQueueJobInput!) {
    deleteOneMyQueueJob(input: $input) {
      id
    }
  }
`
