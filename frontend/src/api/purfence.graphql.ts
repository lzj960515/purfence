import { gql } from '@apollo/client'

export const CREATE_ONE_PURFENCE_PROJECT_MUTATION = gql`
  mutation CreateOnePurfenceProject($input: CreateOnePurfenceProjectInput!) {
    createOnePurfenceProject(input: $input) {
      id
      name
      description
      localRootPath
      externalPath
      defaultBranch
      createdAt
      updatedAt
    }
  }
`

export const PURFENCE_CREATE_ISSUE_MUTATION = gql`
  mutation CreateOnePurfenceIssue($input: CreateOnePurfenceIssueInput!) {
    createOnePurfenceIssue(input: $input) {
      id
      projectId
      title
      description
      status
      latestExecutionId
      createdAt
      updatedAt
      workdir
    }
  }
`

export const PURFENCE_PROJECTS_QUERY = gql`
  query PurfenceProjects($paging: OffsetPaging, $filter: PurfenceProjectFilter, $sorting: [PurfenceProjectSort!]) {
    purfenceProjects(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        name
        description
        localRootPath
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const PURFENCE_ISSUE_QUERY = gql`
  query PurfenceIssue($id: ID!) {
    purfenceIssue(id: $id) {
      id
      projectId
      title
      description
      status
      latestExecutionId
      workdir
      createdAt
      updatedAt
    }
  }
`

export const PURFENCE_PROJECT_QUERY = gql`
  query PurfenceProject($id: ID!) {
    purfenceProject(id: $id) {
      id
      name
      description
      localRootPath
      createdAt
      updatedAt
    }
  }
`

export const PURFENCE_ISSUES_QUERY = gql`
  query PurfenceIssues($paging: OffsetPaging, $filter: PurfenceIssueFilter, $sorting: [PurfenceIssueSort!]) {
    purfenceIssues(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        projectId
        title
        description
        status
        latestExecutionId
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const PURFENCE_EXECUTIONS_QUERY = gql`
  query PurfenceExecutions($paging: OffsetPaging, $filter: PurfenceExecutionFilter, $sorting: [PurfenceExecutionSort!]) {
    purfenceExecutions(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        projectId
        issueId
        goal
        status
        branchName
        worktreePath
        executionDir
        error
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const DELETE_ONE_PURFENCE_ISSUE_MUTATION = gql`
  mutation DeleteOnePurfenceIssue($input: DeleteOnePurfenceIssueInput!) {
    deleteOnePurfenceIssue(input: $input)
  }
`

export const START_ISSUE_MUTATION = gql`
  mutation StartIssue($id: ID!) {
    startIssue(id: $id)
  }
`
