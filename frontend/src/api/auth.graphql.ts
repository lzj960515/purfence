import { gql } from '@apollo/client'

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        uid
        sub
        roles
        isLocal
      }
    }
  }
`

export const ME_QUERY = gql`
  query Me {
    me {
      uid
      sub
      roles
      isLocal
    }
  }
`

