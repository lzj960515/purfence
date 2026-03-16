import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  URL: { input: any; output: any; }
  _Any: { input: any; output: any; }
  federation__FieldSet: { input: any; output: any; }
  link__Import: { input: any; output: any; }
};

export type Agent = {
  __typename?: 'Agent';
  changeDescription?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  instructions?: Maybe<Scalars['String']['output']>;
  modelConfig?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  skills?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  tools?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AgentArtifact = {
  __typename?: 'AgentArtifact';
  content?: Maybe<AgentArtifactContentDto>;
  conversationId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  toolName: Scalars['String']['output'];
  type?: Maybe<AgentArtifactType>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AgentArtifactConnection = {
  __typename?: 'AgentArtifactConnection';
  /** Array of nodes. */
  nodes: Array<AgentArtifact>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AgentArtifactContentDto = {
  chunk?: Maybe<Scalars['Boolean']['output']>;
  footer?: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
};

export type AgentArtifactFileContentDto = AgentArtifactContentDto & {
  __typename?: 'AgentArtifactFileContentDto';
  chunk?: Maybe<Scalars['Boolean']['output']>;
  fileType: AgentArtifactFileType;
  fileUrl: Scalars['URL']['output'];
  filename: Scalars['String']['output'];
  footer?: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
};

/** Type of file artifact */
export type AgentArtifactFileType =
  | 'DOCX'
  | 'PDF'
  | 'XLSX';

export type AgentArtifactFilter = {
  and?: InputMaybe<Array<AgentArtifactFilter>>;
  conversationId?: InputMaybe<IdFilterComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<AgentArtifactFilter>>;
  toolName?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type AgentArtifactImageContentDto = AgentArtifactContentDto & {
  __typename?: 'AgentArtifactImageContentDto';
  chunk?: Maybe<Scalars['Boolean']['output']>;
  footer?: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
  url: Scalars['URL']['output'];
};

export type AgentArtifactSort = {
  direction: SortDirection;
  field: AgentArtifactSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type AgentArtifactSortFields =
  | 'conversationId'
  | 'createdAt'
  | 'id'
  | 'toolName'
  | 'updatedAt';

/** Type of agent artifact content */
export type AgentArtifactType =
  | 'FILE'
  | 'IMAGE';

export type AgentArtifactUpdateInput = {
  published: Scalars['Boolean']['input'];
};

export type AgentConnection = {
  __typename?: 'AgentConnection';
  /** Array of nodes. */
  nodes: Array<Agent>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AgentConversation = {
  __typename?: 'AgentConversation';
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type AgentConversationConnection = {
  __typename?: 'AgentConversationConnection';
  /** Array of nodes. */
  nodes: Array<AgentConversation>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AgentConversationCreateInput = {
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type AgentConversationDeleteResponse = {
  __typename?: 'AgentConversationDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AgentConversationFilter = {
  and?: InputMaybe<Array<AgentConversationFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<AgentConversationFilter>>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type AgentConversationSort = {
  direction: SortDirection;
  field: AgentConversationSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type AgentConversationSortFields =
  | 'createdAt'
  | 'id'
  | 'title'
  | 'updatedAt'
  | 'userId';

export type AgentConversationUpdateInput = {
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type AgentCreateInput = {
  changeDescription?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  modelConfig?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  skills?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  tools?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type AgentDeleteResponse = {
  __typename?: 'AgentDeleteResponse';
  changeDescription?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  instructions?: Maybe<Scalars['String']['output']>;
  modelConfig?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  skills?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  tools?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type AgentFilter = {
  and?: InputMaybe<Array<AgentFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<AgentFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type AgentHistory = {
  __typename?: 'AgentHistory';
  agentId: Scalars['String']['output'];
  changeDescription?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  instructions?: Maybe<Scalars['String']['output']>;
  modelConfig?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  skills?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  tools?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AgentHistoryConnection = {
  __typename?: 'AgentHistoryConnection';
  /** Array of nodes. */
  nodes: Array<AgentHistory>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AgentHistoryDeleteResponse = {
  __typename?: 'AgentHistoryDeleteResponse';
  agentId?: Maybe<Scalars['String']['output']>;
  changeDescription?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  instructions?: Maybe<Scalars['String']['output']>;
  modelConfig?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  skills?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  tools?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  version?: Maybe<Scalars['Int']['output']>;
};

export type AgentHistoryFilter = {
  agentId?: InputMaybe<StringFieldComparison>;
  and?: InputMaybe<Array<AgentHistoryFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<AgentHistoryFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  version?: InputMaybe<IntFieldComparison>;
};

export type AgentHistorySort = {
  direction: SortDirection;
  field: AgentHistorySortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type AgentHistorySortFields =
  | 'agentId'
  | 'createdAt'
  | 'id'
  | 'updatedAt'
  | 'version';

export type AgentSort = {
  direction: SortDirection;
  field: AgentSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type AgentSortFields =
  | 'createdAt'
  | 'id'
  | 'name'
  | 'updatedAt';

export type AgentUpdateInput = {
  changeDescription?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  modelConfig?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  tools?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Third-party app integration type */
export type AppConfigType =
  | 'SLACK';

export type AppConfigTypeFilterComparison = {
  eq?: InputMaybe<AppConfigType>;
  gt?: InputMaybe<AppConfigType>;
  gte?: InputMaybe<AppConfigType>;
  iLike?: InputMaybe<AppConfigType>;
  in?: InputMaybe<Array<AppConfigType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<AppConfigType>;
  lt?: InputMaybe<AppConfigType>;
  lte?: InputMaybe<AppConfigType>;
  neq?: InputMaybe<AppConfigType>;
  notILike?: InputMaybe<AppConfigType>;
  notIn?: InputMaybe<Array<AppConfigType>>;
  notLike?: InputMaybe<AppConfigType>;
};

export type BooleanFieldComparison = {
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateManyPurfenceIssuesInput = {
  /** Array of records to create */
  purfenceIssues: Array<PurfenceIssueCreateInput>;
};

export type CreateOneAgentConversationInput = {
  /** The record to create */
  agentConversation: AgentConversationCreateInput;
};

export type CreateOneAgentInput = {
  /** The record to create */
  agent: AgentCreateInput;
};

export type CreateOneModelProviderInput = {
  /** The record to create */
  modelProvider: ModelProviderCreateInput;
};

export type CreateOneMyQueueInput = {
  /** The record to create */
  myQueue: MyQueueCreateInput;
};

export type CreateOneMyQueueJobInput = {
  /** The record to create */
  myQueueJob: MyQueueJobCreateInput;
};

export type CreateOnePurfenceAppConfigInput = {
  /** The record to create */
  purfenceAppConfig: PurfenceAppConfigCreateInput;
};

export type CreateOnePurfenceConfigInput = {
  /** The record to create */
  purfenceConfig: PurfenceConfigCreateInput;
};

export type CreateOnePurfenceIssueInput = {
  /** The record to create */
  purfenceIssue: PurfenceIssueCreateInput;
};

export type CreateOnePurfenceProjectInput = {
  /** The record to create */
  purfenceProject: PurfenceProjectCreateInput;
};

export type DateFieldComparison = {
  between?: InputMaybe<DateFieldComparisonBetween>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
  notBetween?: InputMaybe<DateFieldComparisonBetween>;
  notIn?: InputMaybe<Array<Scalars['DateTime']['input']>>;
};

export type DateFieldComparisonBetween = {
  lower: Scalars['DateTime']['input'];
  upper: Scalars['DateTime']['input'];
};

export type DeleteManyPurfenceExecutionsInput = {
  /** Filter to find records to delete */
  filter: PurfenceExecutionDeleteFilter;
};

export type DeleteManyPurfenceProjectsInput = {
  /** Filter to find records to delete */
  filter: PurfenceProjectDeleteFilter;
};

export type DeleteManyResponse = {
  __typename?: 'DeleteManyResponse';
  /** The number of records deleted. */
  deletedCount: Scalars['Int']['output'];
};

export type DeleteOneAgentConversationInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneAgentHistoryInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneAgentInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneModelProviderInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneMyQueueInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneMyQueueJobInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceAppConfigInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceConfigInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceExecutionInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceIssueInput = {
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceProjectInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type ExecutionStage =
  | 'tianfu'
  | 'tianji';

export type ExecutionStageFilterComparison = {
  eq?: InputMaybe<ExecutionStage>;
  gt?: InputMaybe<ExecutionStage>;
  gte?: InputMaybe<ExecutionStage>;
  iLike?: InputMaybe<ExecutionStage>;
  in?: InputMaybe<Array<ExecutionStage>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<ExecutionStage>;
  lt?: InputMaybe<ExecutionStage>;
  lte?: InputMaybe<ExecutionStage>;
  neq?: InputMaybe<ExecutionStage>;
  notILike?: InputMaybe<ExecutionStage>;
  notIn?: InputMaybe<Array<ExecutionStage>>;
  notLike?: InputMaybe<ExecutionStage>;
};

export type IdFilterComparison = {
  eq?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  iLike?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['ID']['input']>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  neq?: InputMaybe<Scalars['ID']['input']>;
  notILike?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<Scalars['ID']['input']>>;
  notLike?: InputMaybe<Scalars['ID']['input']>;
};

export type IntFieldComparison = {
  between?: InputMaybe<IntFieldComparisonBetween>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
  notBetween?: InputMaybe<IntFieldComparisonBetween>;
  notIn?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type IntFieldComparisonBetween = {
  lower: Scalars['Int']['input'];
  upper: Scalars['Int']['input'];
};

export type IssueOrigin =
  | 'ai'
  | 'remote'
  | 'user';

export type ModelProvider = {
  __typename?: 'ModelProvider';
  baseUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  provider: ProviderType;
  updatedAt: Scalars['DateTime']['output'];
};

export type ModelProviderConnection = {
  __typename?: 'ModelProviderConnection';
  /** Array of nodes. */
  nodes: Array<ModelProvider>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type ModelProviderCreateInput = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  isActive?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  provider: ProviderType;
};

export type ModelProviderDeleteResponse = {
  __typename?: 'ModelProviderDeleteResponse';
  baseUrl?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<ProviderType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ModelProviderFilter = {
  and?: InputMaybe<Array<ModelProviderFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isActive?: InputMaybe<BooleanFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<ModelProviderFilter>>;
  provider?: InputMaybe<ProviderTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type ModelProviderSort = {
  direction: SortDirection;
  field: ModelProviderSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type ModelProviderSortFields =
  | 'createdAt'
  | 'id'
  | 'isActive'
  | 'name'
  | 'provider'
  | 'updatedAt';

export type ModelProviderUpdateInput = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<ProviderType>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createManyPurfenceIssues: Array<PurfenceIssue>;
  createOneAgent: Agent;
  createOneAgentConversation: AgentConversation;
  createOneModelProvider: ModelProvider;
  createOneMyQueue: MyQueue;
  createOneMyQueueJob: MyQueueJob;
  createOnePurfenceAppConfig: PurfenceAppConfig;
  createOnePurfenceConfig: PurfenceConfig;
  createOnePurfenceIssue: PurfenceIssue;
  createOnePurfenceProject: PurfenceProject;
  createPurfenceScheduledTask: PurfenceScheduledTask;
  deleteManyPurfenceExecutions: DeleteManyResponse;
  deleteManyPurfenceProjects: DeleteManyResponse;
  deleteOneAgent: AgentDeleteResponse;
  deleteOneAgentConversation: AgentConversationDeleteResponse;
  deleteOneAgentHistory: AgentHistoryDeleteResponse;
  deleteOneModelProvider: ModelProviderDeleteResponse;
  deleteOneMyQueue: MyQueueDeleteResponse;
  deleteOneMyQueueJob: MyQueueJobDeleteResponse;
  deleteOnePurfenceAppConfig: PurfenceAppConfigDeleteResponse;
  deleteOnePurfenceConfig: PurfenceConfigDeleteResponse;
  deleteOnePurfenceExecution: PurfenceExecutionDeleteResponse;
  deleteOnePurfenceIssue: Scalars['ID']['output'];
  deleteOnePurfenceProject: PurfenceProjectDeleteResponse;
  deletePurfenceScheduledTask: Scalars['ID']['output'];
  rollbackAgentHistory: Agent;
  runPurfenceScheduledTask: Scalars['ID']['output'];
  startIssue: Scalars['ID']['output'];
  startRemoteIssue: PurfenceIssue;
  updateManyPurfenceExecutions: UpdateManyResponse;
  updateManyPurfenceIssues: UpdateManyResponse;
  updateManyPurfenceProjects: UpdateManyResponse;
  updateOneAgent: Agent;
  updateOneAgentArtifact: AgentArtifact;
  updateOneAgentConversation: AgentConversation;
  updateOneModelProvider: ModelProvider;
  updateOneMyQueue: MyQueue;
  updateOneMyQueueJob: MyQueueJob;
  updateOnePurfenceAppConfig: PurfenceAppConfig;
  updateOnePurfenceConfig: PurfenceConfig;
  updateOnePurfenceExecution: PurfenceExecution;
  updateOnePurfenceIssue: PurfenceIssue;
  updateOnePurfenceProject: PurfenceProject;
  updatePurfenceScheduledTask: PurfenceScheduledTask;
};


export type MutationCreateManyPurfenceIssuesArgs = {
  input: CreateManyPurfenceIssuesInput;
};


export type MutationCreateOneAgentArgs = {
  input: CreateOneAgentInput;
};


export type MutationCreateOneAgentConversationArgs = {
  input: CreateOneAgentConversationInput;
};


export type MutationCreateOneModelProviderArgs = {
  input: CreateOneModelProviderInput;
};


export type MutationCreateOneMyQueueArgs = {
  input: CreateOneMyQueueInput;
};


export type MutationCreateOneMyQueueJobArgs = {
  input: CreateOneMyQueueJobInput;
};


export type MutationCreateOnePurfenceAppConfigArgs = {
  input: CreateOnePurfenceAppConfigInput;
};


export type MutationCreateOnePurfenceConfigArgs = {
  input: CreateOnePurfenceConfigInput;
};


export type MutationCreateOnePurfenceIssueArgs = {
  input: CreateOnePurfenceIssueInput;
};


export type MutationCreateOnePurfenceProjectArgs = {
  input: CreateOnePurfenceProjectInput;
};


export type MutationCreatePurfenceScheduledTaskArgs = {
  input: PurfenceScheduledTaskCreateInput;
};


export type MutationDeleteManyPurfenceExecutionsArgs = {
  input: DeleteManyPurfenceExecutionsInput;
};


export type MutationDeleteManyPurfenceProjectsArgs = {
  input: DeleteManyPurfenceProjectsInput;
};


export type MutationDeleteOneAgentArgs = {
  input: DeleteOneAgentInput;
};


export type MutationDeleteOneAgentConversationArgs = {
  input: DeleteOneAgentConversationInput;
};


export type MutationDeleteOneAgentHistoryArgs = {
  input: DeleteOneAgentHistoryInput;
};


export type MutationDeleteOneModelProviderArgs = {
  input: DeleteOneModelProviderInput;
};


export type MutationDeleteOneMyQueueArgs = {
  input: DeleteOneMyQueueInput;
};


export type MutationDeleteOneMyQueueJobArgs = {
  input: DeleteOneMyQueueJobInput;
};


export type MutationDeleteOnePurfenceAppConfigArgs = {
  input: DeleteOnePurfenceAppConfigInput;
};


export type MutationDeleteOnePurfenceConfigArgs = {
  input: DeleteOnePurfenceConfigInput;
};


export type MutationDeleteOnePurfenceExecutionArgs = {
  input: DeleteOnePurfenceExecutionInput;
};


export type MutationDeleteOnePurfenceIssueArgs = {
  input: DeleteOnePurfenceIssueInput;
};


export type MutationDeleteOnePurfenceProjectArgs = {
  input: DeleteOnePurfenceProjectInput;
};


export type MutationDeletePurfenceScheduledTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRollbackAgentHistoryArgs = {
  agentId: Scalars['ID']['input'];
  changeDescription?: InputMaybe<Scalars['String']['input']>;
  historyId: Scalars['ID']['input'];
};


export type MutationRunPurfenceScheduledTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationStartIssueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationStartRemoteIssueArgs = {
  issueId: Scalars['ID']['input'];
};


export type MutationUpdateManyPurfenceExecutionsArgs = {
  input: UpdateManyPurfenceExecutionsInput;
};


export type MutationUpdateManyPurfenceIssuesArgs = {
  input: UpdateManyPurfenceIssuesInput;
};


export type MutationUpdateManyPurfenceProjectsArgs = {
  input: UpdateManyPurfenceProjectsInput;
};


export type MutationUpdateOneAgentArgs = {
  input: UpdateOneAgentInput;
};


export type MutationUpdateOneAgentArtifactArgs = {
  input: UpdateOneAgentArtifactInput;
};


export type MutationUpdateOneAgentConversationArgs = {
  input: UpdateOneAgentConversationInput;
};


export type MutationUpdateOneModelProviderArgs = {
  input: UpdateOneModelProviderInput;
};


export type MutationUpdateOneMyQueueArgs = {
  input: UpdateOneMyQueueInput;
};


export type MutationUpdateOneMyQueueJobArgs = {
  input: UpdateOneMyQueueJobInput;
};


export type MutationUpdateOnePurfenceAppConfigArgs = {
  input: UpdateOnePurfenceAppConfigInput;
};


export type MutationUpdateOnePurfenceConfigArgs = {
  input: UpdateOnePurfenceConfigInput;
};


export type MutationUpdateOnePurfenceExecutionArgs = {
  input: UpdateOnePurfenceExecutionInput;
};


export type MutationUpdateOnePurfenceIssueArgs = {
  input: UpdateOnePurfenceIssueInput;
};


export type MutationUpdateOnePurfenceProjectArgs = {
  input: UpdateOnePurfenceProjectInput;
};


export type MutationUpdatePurfenceScheduledTaskArgs = {
  id: Scalars['ID']['input'];
  update: PurfenceScheduledTaskUpdateInput;
};

export type MyQueue = {
  __typename?: 'MyQueue';
  attempts: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  isPaused: Scalars['Boolean']['output'];
  maxConcurrency: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type MyQueueConnection = {
  __typename?: 'MyQueueConnection';
  /** Array of nodes. */
  nodes: Array<MyQueue>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type MyQueueCreateInput = {
  attempts?: Scalars['Int']['input'];
  isPaused?: Scalars['Boolean']['input'];
  maxConcurrency?: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};

export type MyQueueDeleteResponse = {
  __typename?: 'MyQueueDeleteResponse';
  attempts?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  isPaused?: Maybe<Scalars['Boolean']['output']>;
  maxConcurrency?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MyQueueFilter = {
  and?: InputMaybe<Array<MyQueueFilter>>;
  attempts?: InputMaybe<IntFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isPaused?: InputMaybe<BooleanFieldComparison>;
  maxConcurrency?: InputMaybe<IntFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<MyQueueFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type MyQueueJob = {
  __typename?: 'MyQueueJob';
  attempts: Scalars['Int']['output'];
  availableAt: Scalars['DateTime']['output'];
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['JSON']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  queueId: Scalars['String']['output'];
  queueName: Scalars['String']['output'];
  runCount: Scalars['Int']['output'];
  runningAt?: Maybe<Scalars['DateTime']['output']>;
  status: MyQueueJobStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type MyQueueJobConnection = {
  __typename?: 'MyQueueJobConnection';
  /** Array of nodes. */
  nodes: Array<MyQueueJob>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type MyQueueJobCreateInput = {
  attempts?: Scalars['Int']['input'];
  availableAt: Scalars['DateTime']['input'];
  data: Scalars['JSON']['input'];
  queueId: Scalars['String']['input'];
  queueName: Scalars['String']['input'];
};

export type MyQueueJobDeleteResponse = {
  __typename?: 'MyQueueJobDeleteResponse';
  attempts?: Maybe<Scalars['Int']['output']>;
  availableAt?: Maybe<Scalars['DateTime']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  data?: Maybe<Scalars['JSON']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  queueId?: Maybe<Scalars['String']['output']>;
  queueName?: Maybe<Scalars['String']['output']>;
  runCount?: Maybe<Scalars['Int']['output']>;
  runningAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<MyQueueJobStatus>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MyQueueJobFilter = {
  and?: InputMaybe<Array<MyQueueJobFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<MyQueueJobFilter>>;
  queueId?: InputMaybe<StringFieldComparison>;
  queueName?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<MyQueueJobStatusFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type MyQueueJobSort = {
  direction: SortDirection;
  field: MyQueueJobSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type MyQueueJobSortFields =
  | 'createdAt'
  | 'id'
  | 'queueId'
  | 'queueName'
  | 'status'
  | 'updatedAt';

export type MyQueueJobStatus =
  | 'failed'
  | 'pending'
  | 'running'
  | 'succeeded';

export type MyQueueJobStatusFilterComparison = {
  eq?: InputMaybe<MyQueueJobStatus>;
  gt?: InputMaybe<MyQueueJobStatus>;
  gte?: InputMaybe<MyQueueJobStatus>;
  iLike?: InputMaybe<MyQueueJobStatus>;
  in?: InputMaybe<Array<MyQueueJobStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<MyQueueJobStatus>;
  lt?: InputMaybe<MyQueueJobStatus>;
  lte?: InputMaybe<MyQueueJobStatus>;
  neq?: InputMaybe<MyQueueJobStatus>;
  notILike?: InputMaybe<MyQueueJobStatus>;
  notIn?: InputMaybe<Array<MyQueueJobStatus>>;
  notLike?: InputMaybe<MyQueueJobStatus>;
};

export type MyQueueJobUpdateInput = {
  attempts?: InputMaybe<Scalars['Int']['input']>;
  availableAt?: InputMaybe<Scalars['DateTime']['input']>;
  data?: InputMaybe<Scalars['JSON']['input']>;
  queueId?: InputMaybe<Scalars['String']['input']>;
  queueName?: InputMaybe<Scalars['String']['input']>;
};

export type MyQueueSort = {
  direction: SortDirection;
  field: MyQueueSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type MyQueueSortFields =
  | 'attempts'
  | 'createdAt'
  | 'id'
  | 'isPaused'
  | 'maxConcurrency'
  | 'name'
  | 'updatedAt';

export type MyQueueUpdateInput = {
  attempts?: InputMaybe<Scalars['Int']['input']>;
  isPaused?: InputMaybe<Scalars['Boolean']['input']>;
  maxConcurrency?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type OffsetPageInfo = {
  __typename?: 'OffsetPageInfo';
  /** true if paging forward and there are more records. */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** true if paging backwards and there are more records. */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
};

export type OffsetPaging = {
  /** Limit the number of records returned */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Offset to start returning records from */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** AI model provider type */
export type ProviderType =
  | 'ANTHROPIC'
  | 'OPENAI'
  | 'OPENAI_COMPATIBLE';

export type ProviderTypeFilterComparison = {
  eq?: InputMaybe<ProviderType>;
  gt?: InputMaybe<ProviderType>;
  gte?: InputMaybe<ProviderType>;
  iLike?: InputMaybe<ProviderType>;
  in?: InputMaybe<Array<ProviderType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<ProviderType>;
  lt?: InputMaybe<ProviderType>;
  lte?: InputMaybe<ProviderType>;
  neq?: InputMaybe<ProviderType>;
  notILike?: InputMaybe<ProviderType>;
  notIn?: InputMaybe<Array<ProviderType>>;
  notLike?: InputMaybe<ProviderType>;
};

export type PurfenceAppConfig = {
  __typename?: 'PurfenceAppConfig';
  config?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['DateTime']['output'];
  enabled: Scalars['Boolean']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: AppConfigType;
  updatedAt: Scalars['DateTime']['output'];
};

export type PurfenceAppConfigConnection = {
  __typename?: 'PurfenceAppConfigConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceAppConfig>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceAppConfigCreateInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  enabled?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  type: AppConfigType;
};

export type PurfenceAppConfigDeleteResponse = {
  __typename?: 'PurfenceAppConfigDeleteResponse';
  config?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type?: Maybe<AppConfigType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type PurfenceAppConfigFilter = {
  and?: InputMaybe<Array<PurfenceAppConfigFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceAppConfigFilter>>;
  type?: InputMaybe<AppConfigTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceAppConfigSort = {
  direction: SortDirection;
  field: PurfenceAppConfigSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceAppConfigSortFields =
  | 'createdAt'
  | 'id'
  | 'name'
  | 'type'
  | 'updatedAt';

export type PurfenceAppConfigUpdateInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<AppConfigType>;
};

export type PurfenceConfig = {
  __typename?: 'PurfenceConfig';
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['JSON']['output']>;
};

export type PurfenceConfigConnection = {
  __typename?: 'PurfenceConfigConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceConfig>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceConfigCreateInput = {
  key: Scalars['String']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type PurfenceConfigDeleteResponse = {
  __typename?: 'PurfenceConfigDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  value?: Maybe<Scalars['JSON']['output']>;
};

export type PurfenceConfigFilter = {
  and?: InputMaybe<Array<PurfenceConfigFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<PurfenceConfigFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceConfigSort = {
  direction: SortDirection;
  field: PurfenceConfigSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceConfigSortFields =
  | 'createdAt'
  | 'id'
  | 'updatedAt';

export type PurfenceConfigUpdateInput = {
  key?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type PurfenceExecution = {
  __typename?: 'PurfenceExecution';
  branchName?: Maybe<Scalars['String']['output']>;
  conversationId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  error?: Maybe<Scalars['String']['output']>;
  executionDir?: Maybe<Scalars['String']['output']>;
  goal?: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  issueId: Scalars['String']['output'];
  jobQueryUrl?: Maybe<Scalars['String']['output']>;
  parentExecutionId?: Maybe<Scalars['String']['output']>;
  projectId: Scalars['String']['output'];
  stage: ExecutionStage;
  status: PurfenceStatus;
  updatedAt: Scalars['DateTime']['output'];
  worktreePath?: Maybe<Scalars['String']['output']>;
};

export type PurfenceExecutionConnection = {
  __typename?: 'PurfenceExecutionConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceExecution>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceExecutionDeleteFilter = {
  and?: InputMaybe<Array<PurfenceExecutionDeleteFilter>>;
  conversationId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  issueId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceExecutionDeleteFilter>>;
  projectId?: InputMaybe<StringFieldComparison>;
  stage?: InputMaybe<ExecutionStageFilterComparison>;
  status?: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionDeleteResponse = {
  __typename?: 'PurfenceExecutionDeleteResponse';
  branchName?: Maybe<Scalars['String']['output']>;
  conversationId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executionDir?: Maybe<Scalars['String']['output']>;
  goal?: Maybe<Scalars['String']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  issueId?: Maybe<Scalars['String']['output']>;
  jobQueryUrl?: Maybe<Scalars['String']['output']>;
  parentExecutionId?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<ExecutionStage>;
  status?: Maybe<PurfenceStatus>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  worktreePath?: Maybe<Scalars['String']['output']>;
};

export type PurfenceExecutionFilter = {
  and?: InputMaybe<Array<PurfenceExecutionFilter>>;
  conversationId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  issueId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceExecutionFilter>>;
  projectId?: InputMaybe<StringFieldComparison>;
  stage?: InputMaybe<ExecutionStageFilterComparison>;
  status?: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionSort = {
  direction: SortDirection;
  field: PurfenceExecutionSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceExecutionSortFields =
  | 'conversationId'
  | 'createdAt'
  | 'id'
  | 'issueId'
  | 'projectId'
  | 'stage'
  | 'status'
  | 'updatedAt';

export type PurfenceExecutionUpdateFilter = {
  and?: InputMaybe<Array<PurfenceExecutionUpdateFilter>>;
  conversationId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  issueId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceExecutionUpdateFilter>>;
  projectId?: InputMaybe<StringFieldComparison>;
  stage?: InputMaybe<ExecutionStageFilterComparison>;
  status?: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionUpdateInput = {
  error?: InputMaybe<Scalars['String']['input']>;
  goal?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PurfenceStatus>;
};

export type PurfenceIssue = {
  __typename?: 'PurfenceIssue';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  latestExecutionId?: Maybe<Scalars['String']['output']>;
  projectId: Scalars['String']['output'];
  status: PurfenceStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workdir?: Maybe<Scalars['String']['output']>;
};

export type PurfenceIssueConnection = {
  __typename?: 'PurfenceIssueConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceIssue>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceIssueCreateInput = {
  dependsOnIssueId?: InputMaybe<Scalars['ID']['input']>;
  description: Scalars['String']['input'];
  origin?: InputMaybe<IssueOrigin>;
  projectId: Scalars['ID']['input'];
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type PurfenceIssueFilter = {
  and?: InputMaybe<Array<PurfenceIssueFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  latestExecutionId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceIssueFilter>>;
  projectId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<PurfenceStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceIssueSort = {
  direction: SortDirection;
  field: PurfenceIssueSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceIssueSortFields =
  | 'createdAt'
  | 'id'
  | 'latestExecutionId'
  | 'projectId'
  | 'status'
  | 'title'
  | 'updatedAt';

export type PurfenceIssueUpdateFilter = {
  and?: InputMaybe<Array<PurfenceIssueUpdateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  latestExecutionId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceIssueUpdateFilter>>;
  projectId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<PurfenceStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceIssueUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PurfenceStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceProject = {
  __typename?: 'PurfenceProject';
  createdAt: Scalars['DateTime']['output'];
  defaultBranch: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  externalPath?: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  localRootPath: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  slackAppConfigId?: Maybe<Scalars['String']['output']>;
  slackChannelId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PurfenceProjectConnection = {
  __typename?: 'PurfenceProjectConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceProject>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceProjectCreateInput = {
  defaultBranch?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  externalPath?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};

export type PurfenceProjectDeleteFilter = {
  and?: InputMaybe<Array<PurfenceProjectDeleteFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  defaultBranch?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  localRootPath?: InputMaybe<StringFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceProjectDeleteFilter>>;
  slackAppConfigId?: InputMaybe<StringFieldComparison>;
  slackChannelId?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectDeleteResponse = {
  __typename?: 'PurfenceProjectDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  defaultBranch?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  externalPath?: Maybe<Scalars['String']['output']>;
  /** ID */
  id?: Maybe<Scalars['ID']['output']>;
  localRootPath?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  slackAppConfigId?: Maybe<Scalars['String']['output']>;
  slackChannelId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type PurfenceProjectFilter = {
  and?: InputMaybe<Array<PurfenceProjectFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  defaultBranch?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  localRootPath?: InputMaybe<StringFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceProjectFilter>>;
  slackAppConfigId?: InputMaybe<StringFieldComparison>;
  slackChannelId?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectSort = {
  direction: SortDirection;
  field: PurfenceProjectSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceProjectSortFields =
  | 'createdAt'
  | 'defaultBranch'
  | 'id'
  | 'localRootPath'
  | 'name'
  | 'slackAppConfigId'
  | 'slackChannelId'
  | 'updatedAt';

export type PurfenceProjectUpdateFilter = {
  and?: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  defaultBranch?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  localRootPath?: InputMaybe<StringFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  slackAppConfigId?: InputMaybe<StringFieldComparison>;
  slackChannelId?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId?: InputMaybe<Scalars['String']['input']>;
  slackChannelId?: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceScheduledTask = {
  __typename?: 'PurfenceScheduledTask';
  createdAt: Scalars['DateTime']['output'];
  cronExpr?: Maybe<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  kind: PurfenceScheduledTaskKind;
  lastError?: Maybe<Scalars['String']['output']>;
  lastRunAt?: Maybe<Scalars['DateTime']['output']>;
  lastStatus?: Maybe<PurfenceScheduledTaskLastStatus>;
  name: Scalars['String']['output'];
  nextRunAt?: Maybe<Scalars['DateTime']['output']>;
  prompt: Scalars['String']['output'];
  runAt?: Maybe<Scalars['DateTime']['output']>;
  runCount: Scalars['Int']['output'];
  slackAppConfigId?: Maybe<Scalars['String']['output']>;
  slackChannelId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PurfenceScheduledTaskConnection = {
  __typename?: 'PurfenceScheduledTaskConnection';
  /** Array of nodes. */
  nodes: Array<PurfenceScheduledTask>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type PurfenceScheduledTaskCreateInput = {
  cronExpr?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  kind: PurfenceScheduledTaskKind;
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  runAt?: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId?: InputMaybe<Scalars['String']['input']>;
  slackChannelId?: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceScheduledTaskFilter = {
  and?: InputMaybe<Array<PurfenceScheduledTaskFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  enabled?: InputMaybe<BooleanFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  kind?: InputMaybe<PurfenceScheduledTaskKindFilterComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<PurfenceScheduledTaskFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type PurfenceScheduledTaskKind =
  | 'one_time'
  | 'recurring';

export type PurfenceScheduledTaskKindFilterComparison = {
  eq?: InputMaybe<PurfenceScheduledTaskKind>;
  gt?: InputMaybe<PurfenceScheduledTaskKind>;
  gte?: InputMaybe<PurfenceScheduledTaskKind>;
  iLike?: InputMaybe<PurfenceScheduledTaskKind>;
  in?: InputMaybe<Array<PurfenceScheduledTaskKind>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<PurfenceScheduledTaskKind>;
  lt?: InputMaybe<PurfenceScheduledTaskKind>;
  lte?: InputMaybe<PurfenceScheduledTaskKind>;
  neq?: InputMaybe<PurfenceScheduledTaskKind>;
  notILike?: InputMaybe<PurfenceScheduledTaskKind>;
  notIn?: InputMaybe<Array<PurfenceScheduledTaskKind>>;
  notLike?: InputMaybe<PurfenceScheduledTaskKind>;
};

export type PurfenceScheduledTaskLastStatus =
  | 'failed'
  | 'success';

export type PurfenceScheduledTaskSort = {
  direction: SortDirection;
  field: PurfenceScheduledTaskSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type PurfenceScheduledTaskSortFields =
  | 'createdAt'
  | 'enabled'
  | 'id'
  | 'kind'
  | 'name'
  | 'updatedAt';

export type PurfenceScheduledTaskUpdateInput = {
  cronExpr?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<PurfenceScheduledTaskKind>;
  name?: InputMaybe<Scalars['String']['input']>;
  prompt?: InputMaybe<Scalars['String']['input']>;
  runAt?: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId?: InputMaybe<Scalars['String']['input']>;
  slackChannelId?: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceStatus =
  | 'budget_exhausted'
  | 'done'
  | 'failed'
  | 'needs_approval'
  | 'needs_user'
  | 'open'
  | 'running';

export type PurfenceStatusFilterComparison = {
  eq?: InputMaybe<PurfenceStatus>;
  gt?: InputMaybe<PurfenceStatus>;
  gte?: InputMaybe<PurfenceStatus>;
  iLike?: InputMaybe<PurfenceStatus>;
  in?: InputMaybe<Array<PurfenceStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<PurfenceStatus>;
  lt?: InputMaybe<PurfenceStatus>;
  lte?: InputMaybe<PurfenceStatus>;
  neq?: InputMaybe<PurfenceStatus>;
  notILike?: InputMaybe<PurfenceStatus>;
  notIn?: InputMaybe<Array<PurfenceStatus>>;
  notLike?: InputMaybe<PurfenceStatus>;
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  agent: Agent;
  agentArtifact: AgentArtifact;
  agentArtifacts: AgentArtifactConnection;
  agentConversation: AgentConversation;
  agentConversations: AgentConversationConnection;
  agentHistories: AgentHistoryConnection;
  agentHistory: AgentHistory;
  agents: AgentConnection;
  /** ping test */
  hello?: Maybe<Scalars['JSON']['output']>;
  modelProvider: ModelProvider;
  modelProviders: ModelProviderConnection;
  myQueue: MyQueue;
  myQueueJob: MyQueueJob;
  myQueueJobs: MyQueueJobConnection;
  myQueues: MyQueueConnection;
  purfenceAppConfig: PurfenceAppConfig;
  purfenceAppConfigs: PurfenceAppConfigConnection;
  purfenceConfig: PurfenceConfig;
  purfenceConfigs: PurfenceConfigConnection;
  purfenceExecution: PurfenceExecution;
  purfenceExecutions: PurfenceExecutionConnection;
  purfenceIssue: PurfenceIssue;
  purfenceIssues: PurfenceIssueConnection;
  purfenceListIssueArtifactFiles: Array<Scalars['String']['output']>;
  purfenceProject: PurfenceProject;
  purfenceProjects: PurfenceProjectConnection;
  purfenceReadIssueArtifactFile: Scalars['String']['output'];
  purfenceScheduledTask: PurfenceScheduledTask;
  purfenceScheduledTasks: PurfenceScheduledTaskConnection;
};


export type QueryAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentArtifactArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentArtifactsArgs = {
  filter?: AgentArtifactFilter;
  paging?: OffsetPaging;
  sorting?: Array<AgentArtifactSort>;
};


export type QueryAgentConversationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentConversationsArgs = {
  filter?: AgentConversationFilter;
  paging?: OffsetPaging;
  sorting?: Array<AgentConversationSort>;
};


export type QueryAgentHistoriesArgs = {
  filter?: AgentHistoryFilter;
  paging?: OffsetPaging;
  sorting?: Array<AgentHistorySort>;
};


export type QueryAgentHistoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentsArgs = {
  filter?: AgentFilter;
  paging?: OffsetPaging;
  sorting?: Array<AgentSort>;
};


export type QueryModelProviderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryModelProvidersArgs = {
  filter?: ModelProviderFilter;
  paging?: OffsetPaging;
  sorting?: Array<ModelProviderSort>;
};


export type QueryMyQueueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyQueueJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyQueueJobsArgs = {
  filter?: MyQueueJobFilter;
  paging?: OffsetPaging;
  sorting?: Array<MyQueueJobSort>;
};


export type QueryMyQueuesArgs = {
  filter?: MyQueueFilter;
  paging?: OffsetPaging;
  sorting?: Array<MyQueueSort>;
};


export type QueryPurfenceAppConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceAppConfigsArgs = {
  filter?: PurfenceAppConfigFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceAppConfigSort>;
};


export type QueryPurfenceConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceConfigsArgs = {
  filter?: PurfenceConfigFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceConfigSort>;
};


export type QueryPurfenceExecutionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceExecutionsArgs = {
  filter?: PurfenceExecutionFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceExecutionSort>;
};


export type QueryPurfenceIssueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceIssuesArgs = {
  filter?: PurfenceIssueFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceIssueSort>;
};


export type QueryPurfenceListIssueArtifactFilesArgs = {
  issueId: Scalars['ID']['input'];
};


export type QueryPurfenceProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceProjectsArgs = {
  filter?: PurfenceProjectFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceProjectSort>;
};


export type QueryPurfenceReadIssueArtifactFileArgs = {
  issueId: Scalars['ID']['input'];
  path: Scalars['String']['input'];
};


export type QueryPurfenceScheduledTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceScheduledTasksArgs = {
  filter?: PurfenceScheduledTaskFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceScheduledTaskSort>;
};

/** Sort Directions */
export type SortDirection =
  | 'ASC'
  | 'DESC';

/** Sort Nulls Options */
export type SortNulls =
  | 'NULLS_FIRST'
  | 'NULLS_LAST';

export type StringFieldComparison = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  iLike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  notILike?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateManyPurfenceExecutionsInput = {
  /** Filter used to find fields to update */
  filter: PurfenceExecutionUpdateFilter;
  /** The update to apply to all records found using the filter */
  update: PurfenceExecutionUpdateInput;
};

export type UpdateManyPurfenceIssuesInput = {
  /** Filter used to find fields to update */
  filter: PurfenceIssueUpdateFilter;
  /** The update to apply to all records found using the filter */
  update: PurfenceIssueUpdateInput;
};

export type UpdateManyPurfenceProjectsInput = {
  /** Filter used to find fields to update */
  filter: PurfenceProjectUpdateFilter;
  /** The update to apply to all records found using the filter */
  update: PurfenceProjectUpdateInput;
};

export type UpdateManyResponse = {
  __typename?: 'UpdateManyResponse';
  /** The number of records updated. */
  updatedCount: Scalars['Int']['output'];
};

export type UpdateOneAgentArtifactInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: AgentArtifactUpdateInput;
};

export type UpdateOneAgentConversationInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: AgentConversationUpdateInput;
};

export type UpdateOneAgentInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: AgentUpdateInput;
};

export type UpdateOneModelProviderInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: ModelProviderUpdateInput;
};

export type UpdateOneMyQueueInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: MyQueueUpdateInput;
};

export type UpdateOneMyQueueJobInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: MyQueueJobUpdateInput;
};

export type UpdateOnePurfenceAppConfigInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceAppConfigUpdateInput;
};

export type UpdateOnePurfenceConfigInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceConfigUpdateInput;
};

export type UpdateOnePurfenceExecutionInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceExecutionUpdateInput;
};

export type UpdateOnePurfenceIssueInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceIssueUpdateInput;
};

export type UpdateOnePurfenceProjectInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceProjectUpdateInput;
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export type Link__Purpose =
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  | 'EXECUTION'
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  | 'SECURITY';

export type GetAgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentsQuery = { __typename?: 'Query', agents: { __typename?: 'AgentConnection', totalCount: number, nodes: Array<{ __typename?: 'Agent', id: string, name: string, instructions?: string | null, description?: string | null, changeDescription?: string | null, tags?: Array<string> | null, tools?: Array<string> | null, skills?: Array<string> | null, modelConfig?: any | null, createdAt: any, updatedAt: any }> } };

export type GetAgentHistoriesQueryVariables = Exact<{
  agentId: Scalars['String']['input'];
}>;


export type GetAgentHistoriesQuery = { __typename?: 'Query', agentHistories: { __typename?: 'AgentHistoryConnection', totalCount: number, nodes: Array<{ __typename?: 'AgentHistory', id: string, agentId: string, version: number, name: string, instructions?: string | null, description?: string | null, changeDescription?: string | null, tags?: Array<string> | null, tools?: Array<string> | null, skills?: Array<string> | null, modelConfig?: any | null, createdAt: any, updatedAt: any }> } };

export type AgentConversationsQueryVariables = Exact<{
  filter?: InputMaybe<AgentConversationFilter>;
  paging?: InputMaybe<OffsetPaging>;
  sorting?: InputMaybe<Array<AgentConversationSort> | AgentConversationSort>;
}>;


export type AgentConversationsQuery = { __typename?: 'Query', agentConversations: { __typename?: 'AgentConversationConnection', totalCount: number, nodes: Array<{ __typename?: 'AgentConversation', id: string, userId?: string | null, title?: string | null, createdAt: any, updatedAt: any }> } };

export type CreateOneAgentConversationMutationVariables = Exact<{
  input: AgentConversationCreateInput;
}>;


export type CreateOneAgentConversationMutation = { __typename?: 'Mutation', createOneAgentConversation: { __typename?: 'AgentConversation', id: string, userId?: string | null, title?: string | null, createdAt: any, updatedAt: any } };

export type DeleteOneAgentConversationMutationVariables = Exact<{
  input: DeleteOneAgentConversationInput;
}>;


export type DeleteOneAgentConversationMutation = { __typename?: 'Mutation', deleteOneAgentConversation: { __typename?: 'AgentConversationDeleteResponse', id?: string | null } };

export type CreateAgentMutationVariables = Exact<{
  input: AgentCreateInput;
}>;


export type CreateAgentMutation = { __typename?: 'Mutation', createOneAgent: { __typename?: 'Agent', id: string, name: string, instructions?: string | null, description?: string | null, changeDescription?: string | null, tags?: Array<string> | null, tools?: Array<string> | null, skills?: Array<string> | null, modelConfig?: any | null, createdAt: any, updatedAt: any } };

export type UpdateAgentMutationVariables = Exact<{
  input: UpdateOneAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateOneAgent: { __typename?: 'Agent', id: string, name: string, instructions?: string | null, description?: string | null, changeDescription?: string | null, tags?: Array<string> | null, tools?: Array<string> | null, skills?: Array<string> | null, modelConfig?: any | null, createdAt: any, updatedAt: any } };

export type RollbackAgentHistoryMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  historyId: Scalars['ID']['input'];
  changeDescription?: InputMaybe<Scalars['String']['input']>;
}>;


export type RollbackAgentHistoryMutation = { __typename?: 'Mutation', rollbackAgentHistory: { __typename?: 'Agent', id: string, name: string, instructions?: string | null, description?: string | null, tags?: Array<string> | null, tools?: Array<string> | null, skills?: Array<string> | null, modelConfig?: any | null, createdAt: any, updatedAt: any } };

export type DeleteAgentHistoryMutationVariables = Exact<{
  input: DeleteOneAgentHistoryInput;
}>;


export type DeleteAgentHistoryMutation = { __typename?: 'Mutation', deleteOneAgentHistory: { __typename?: 'AgentHistoryDeleteResponse', id?: string | null } };

export type DeleteAgentMutationVariables = Exact<{
  input: DeleteOneAgentInput;
}>;


export type DeleteAgentMutation = { __typename?: 'Mutation', deleteOneAgent: { __typename?: 'AgentDeleteResponse', id?: string | null } };

export type GetAppConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAppConfigsQuery = { __typename?: 'Query', purfenceAppConfigs: { __typename?: 'PurfenceAppConfigConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config?: any | null, createdAt: any, updatedAt: any }> } };

export type CreateAppConfigMutationVariables = Exact<{
  input: CreateOnePurfenceAppConfigInput;
}>;


export type CreateAppConfigMutation = { __typename?: 'Mutation', createOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config?: any | null, createdAt: any, updatedAt: any } };

export type UpdateAppConfigMutationVariables = Exact<{
  input: UpdateOnePurfenceAppConfigInput;
}>;


export type UpdateAppConfigMutation = { __typename?: 'Mutation', updateOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config?: any | null, createdAt: any, updatedAt: any } };

export type DeleteAppConfigMutationVariables = Exact<{
  input: DeleteOnePurfenceAppConfigInput;
}>;


export type DeleteAppConfigMutation = { __typename?: 'Mutation', deleteOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfigDeleteResponse', id?: string | null } };

export type GetProviderConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProviderConfigsQuery = { __typename?: 'Query', modelProviders: { __typename?: 'ModelProviderConnection', totalCount: number, nodes: Array<{ __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl?: string | null, isActive: boolean, createdAt: any, updatedAt: any }> } };

export type GetProviderConfigQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProviderConfigQuery = { __typename?: 'Query', modelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl?: string | null, isActive: boolean, createdAt: any, updatedAt: any } };

export type CreateProviderConfigMutationVariables = Exact<{
  input: CreateOneModelProviderInput;
}>;


export type CreateProviderConfigMutation = { __typename?: 'Mutation', createOneModelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl?: string | null, isActive: boolean, createdAt: any } };

export type UpdateProviderConfigMutationVariables = Exact<{
  input: UpdateOneModelProviderInput;
}>;


export type UpdateProviderConfigMutation = { __typename?: 'Mutation', updateOneModelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl?: string | null, isActive: boolean, updatedAt: any } };

export type DeleteProviderConfigMutationVariables = Exact<{
  input: DeleteOneModelProviderInput;
}>;


export type DeleteProviderConfigMutation = { __typename?: 'Mutation', deleteOneModelProvider: { __typename?: 'ModelProviderDeleteResponse', id?: string | null } };

export type GetAllPurfenceConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllPurfenceConfigsQuery = { __typename?: 'Query', purfenceConfigs: { __typename?: 'PurfenceConfigConnection', nodes: Array<{ __typename?: 'PurfenceConfig', id: string, key: string, value?: any | null, createdAt: any, updatedAt: any }> } };

export type CreatePurfenceConfigMutationVariables = Exact<{
  input: CreateOnePurfenceConfigInput;
}>;


export type CreatePurfenceConfigMutation = { __typename?: 'Mutation', createOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, key: string, value?: any | null, createdAt: any, updatedAt: any } };

export type UpdatePurfenceConfigMutationVariables = Exact<{
  input: UpdateOnePurfenceConfigInput;
}>;


export type UpdatePurfenceConfigMutation = { __typename?: 'Mutation', updateOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, key: string, value?: any | null, createdAt: any, updatedAt: any } };

export type CreateOnePurfenceProjectMutationVariables = Exact<{
  input: CreateOnePurfenceProjectInput;
}>;


export type CreateOnePurfenceProjectMutation = { __typename?: 'Mutation', createOnePurfenceProject: { __typename?: 'PurfenceProject', id: string, name?: string | null, description?: string | null, localRootPath: string, externalPath?: string | null, defaultBranch: string, slackAppConfigId?: string | null, slackChannelId?: string | null, createdAt: any, updatedAt: any } };

export type UpdateOnePurfenceProjectMutationVariables = Exact<{
  input: UpdateOnePurfenceProjectInput;
}>;


export type UpdateOnePurfenceProjectMutation = { __typename?: 'Mutation', updateOnePurfenceProject: { __typename?: 'PurfenceProject', id: string, name?: string | null, description?: string | null, slackAppConfigId?: string | null, slackChannelId?: string | null, updatedAt: any } };

export type CreateOnePurfenceIssueMutationVariables = Exact<{
  input: CreateOnePurfenceIssueInput;
}>;


export type CreateOnePurfenceIssueMutation = { __typename?: 'Mutation', createOnePurfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId?: string | null, createdAt: any, updatedAt: any, workdir?: string | null } };

export type PurfenceProjectsQueryVariables = Exact<{
  paging?: InputMaybe<OffsetPaging>;
  filter?: InputMaybe<PurfenceProjectFilter>;
  sorting?: InputMaybe<Array<PurfenceProjectSort> | PurfenceProjectSort>;
}>;


export type PurfenceProjectsQuery = { __typename?: 'Query', purfenceProjects: { __typename?: 'PurfenceProjectConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceProject', id: string, name?: string | null, description?: string | null, localRootPath: string, slackAppConfigId?: string | null, slackChannelId?: string | null, createdAt: any, updatedAt: any }> } };

export type PurfenceIssueQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceIssueQuery = { __typename?: 'Query', purfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId?: string | null, workdir?: string | null, createdAt: any, updatedAt: any } };

export type PurfenceProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceProjectQuery = { __typename?: 'Query', purfenceProject: { __typename?: 'PurfenceProject', id: string, name?: string | null, description?: string | null, localRootPath: string, slackAppConfigId?: string | null, slackChannelId?: string | null, createdAt: any, updatedAt: any } };

export type PurfenceIssuesQueryVariables = Exact<{
  paging?: InputMaybe<OffsetPaging>;
  filter?: InputMaybe<PurfenceIssueFilter>;
  sorting?: InputMaybe<Array<PurfenceIssueSort> | PurfenceIssueSort>;
}>;


export type PurfenceIssuesQuery = { __typename?: 'Query', purfenceIssues: { __typename?: 'PurfenceIssueConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId?: string | null, createdAt: any, updatedAt: any }> } };

export type PurfenceExecutionsQueryVariables = Exact<{
  paging?: InputMaybe<OffsetPaging>;
  filter?: InputMaybe<PurfenceExecutionFilter>;
  sorting?: InputMaybe<Array<PurfenceExecutionSort> | PurfenceExecutionSort>;
}>;


export type PurfenceExecutionsQuery = { __typename?: 'Query', purfenceExecutions: { __typename?: 'PurfenceExecutionConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceExecution', id: string, projectId: string, issueId: string, goal?: string | null, status: PurfenceStatus, branchName?: string | null, worktreePath?: string | null, executionDir?: string | null, error?: string | null, createdAt: any, updatedAt: any }> } };

export type DeleteOnePurfenceIssueMutationVariables = Exact<{
  input: DeleteOnePurfenceIssueInput;
}>;


export type DeleteOnePurfenceIssueMutation = { __typename?: 'Mutation', deleteOnePurfenceIssue: string };

export type StartIssueMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type StartIssueMutation = { __typename?: 'Mutation', startIssue: string };

export type MyQueuesQueryVariables = Exact<{
  paging: OffsetPaging;
  filter: MyQueueFilter;
  sorting: Array<MyQueueSort> | MyQueueSort;
}>;


export type MyQueuesQuery = { __typename?: 'Query', myQueues: { __typename?: 'MyQueueConnection', totalCount: number, nodes: Array<{ __typename?: 'MyQueue', id: string, name: string, maxConcurrency: number, attempts: number, isPaused: boolean }> } };

export type MyQueueJobsQueryVariables = Exact<{
  paging: OffsetPaging;
  filter: MyQueueJobFilter;
  sorting: Array<MyQueueJobSort> | MyQueueJobSort;
}>;


export type MyQueueJobsQuery = { __typename?: 'Query', myQueueJobs: { __typename?: 'MyQueueJobConnection', totalCount: number, nodes: Array<{ __typename?: 'MyQueueJob', id: string, queueId: string, queueName: string, data: any, status: MyQueueJobStatus, availableAt: any, attempts: number, runCount: number, errorMessage?: string | null, createdAt: any, updatedAt: any, runningAt?: any | null, completedAt?: any | null }> } };

export type MyQueueStatsQueryVariables = Exact<{
  queueId: Scalars['String']['input'];
}>;


export type MyQueueStatsQuery = { __typename?: 'Query', total: { __typename?: 'MyQueueJobConnection', totalCount: number }, pending: { __typename?: 'MyQueueJobConnection', totalCount: number }, running: { __typename?: 'MyQueueJobConnection', totalCount: number }, succeeded: { __typename?: 'MyQueueJobConnection', totalCount: number }, failed: { __typename?: 'MyQueueJobConnection', totalCount: number } };

export type UpdateMyQueueMutationVariables = Exact<{
  input: UpdateOneMyQueueInput;
}>;


export type UpdateMyQueueMutation = { __typename?: 'Mutation', updateOneMyQueue: { __typename?: 'MyQueue', id: string, name: string, maxConcurrency: number, attempts: number, isPaused: boolean } };

export type CreateMyQueueJobMutationVariables = Exact<{
  input: CreateOneMyQueueJobInput;
}>;


export type CreateMyQueueJobMutation = { __typename?: 'Mutation', createOneMyQueueJob: { __typename?: 'MyQueueJob', id: string, queueId: string, queueName: string, status: MyQueueJobStatus, availableAt: any, attempts: number, runCount: number, errorMessage?: string | null, createdAt: any } };

export type DeleteMyQueueJobMutationVariables = Exact<{
  input: DeleteOneMyQueueJobInput;
}>;


export type DeleteMyQueueJobMutation = { __typename?: 'Mutation', deleteOneMyQueueJob: { __typename?: 'MyQueueJobDeleteResponse', id?: string | null } };

export type PurfenceScheduledTasksQueryVariables = Exact<{
  paging?: InputMaybe<OffsetPaging>;
  sorting?: InputMaybe<Array<PurfenceScheduledTaskSort> | PurfenceScheduledTaskSort>;
}>;


export type PurfenceScheduledTasksQuery = { __typename?: 'Query', purfenceScheduledTasks: { __typename?: 'PurfenceScheduledTaskConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceScheduledTask', id: string, name: string, prompt: string, kind: PurfenceScheduledTaskKind, cronExpr?: string | null, runAt?: any | null, enabled: boolean, nextRunAt?: any | null, lastRunAt?: any | null, lastStatus?: PurfenceScheduledTaskLastStatus | null, lastError?: string | null, runCount: number, slackAppConfigId?: string | null, slackChannelId?: string | null, createdAt: any, updatedAt: any }> } };

export type CreatePurfenceScheduledTaskMutationVariables = Exact<{
  input: PurfenceScheduledTaskCreateInput;
}>;


export type CreatePurfenceScheduledTaskMutation = { __typename?: 'Mutation', createPurfenceScheduledTask: { __typename?: 'PurfenceScheduledTask', id: string } };

export type UpdatePurfenceScheduledTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  update: PurfenceScheduledTaskUpdateInput;
}>;


export type UpdatePurfenceScheduledTaskMutation = { __typename?: 'Mutation', updatePurfenceScheduledTask: { __typename?: 'PurfenceScheduledTask', id: string } };

export type DeletePurfenceScheduledTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePurfenceScheduledTaskMutation = { __typename?: 'Mutation', deletePurfenceScheduledTask: string };

export type RunPurfenceScheduledTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RunPurfenceScheduledTaskMutation = { __typename?: 'Mutation', runPurfenceScheduledTask: string };


export const GetAgentsDocument = gql`
    query GetAgents {
  agents(
    paging: {offset: 0, limit: 50}
    sorting: [{field: updatedAt, direction: DESC}]
  ) {
    nodes {
      id
      name
      instructions
      description
      changeDescription
      tags
      tools
      skills
      modelConfig
      createdAt
      updatedAt
    }
    totalCount
  }
}
    `;

/**
 * __useGetAgentsQuery__
 *
 * To run a query within a React component, call `useGetAgentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAgentsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAgentsQuery, GetAgentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgentsQuery, GetAgentsQueryVariables>(GetAgentsDocument, options);
      }
export function useGetAgentsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgentsQuery, GetAgentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgentsQuery, GetAgentsQueryVariables>(GetAgentsDocument, options);
        }
// @ts-ignore
export function useGetAgentsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAgentsQuery, GetAgentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAgentsQuery, GetAgentsQueryVariables>;
export function useGetAgentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgentsQuery, GetAgentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAgentsQuery | undefined, GetAgentsQueryVariables>;
export function useGetAgentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgentsQuery, GetAgentsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgentsQuery, GetAgentsQueryVariables>(GetAgentsDocument, options);
        }
export type GetAgentsQueryHookResult = ReturnType<typeof useGetAgentsQuery>;
export type GetAgentsLazyQueryHookResult = ReturnType<typeof useGetAgentsLazyQuery>;
export type GetAgentsSuspenseQueryHookResult = ReturnType<typeof useGetAgentsSuspenseQuery>;
export type GetAgentsQueryResult = Apollo.QueryResult<GetAgentsQuery, GetAgentsQueryVariables>;
export const GetAgentHistoriesDocument = gql`
    query GetAgentHistories($agentId: String!) {
  agentHistories(
    filter: {agentId: {eq: $agentId}}
    paging: {offset: 0, limit: 50}
    sorting: [{field: version, direction: DESC}]
  ) {
    nodes {
      id
      agentId
      version
      name
      instructions
      description
      changeDescription
      tags
      tools
      skills
      modelConfig
      createdAt
      updatedAt
    }
    totalCount
  }
}
    `;

/**
 * __useGetAgentHistoriesQuery__
 *
 * To run a query within a React component, call `useGetAgentHistoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentHistoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgentHistoriesQuery({
 *   variables: {
 *      agentId: // value for 'agentId'
 *   },
 * });
 */
export function useGetAgentHistoriesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables> & ({ variables: GetAgentHistoriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>(GetAgentHistoriesDocument, options);
      }
export function useGetAgentHistoriesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>(GetAgentHistoriesDocument, options);
        }
// @ts-ignore
export function useGetAgentHistoriesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>;
export function useGetAgentHistoriesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAgentHistoriesQuery | undefined, GetAgentHistoriesQueryVariables>;
export function useGetAgentHistoriesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>(GetAgentHistoriesDocument, options);
        }
export type GetAgentHistoriesQueryHookResult = ReturnType<typeof useGetAgentHistoriesQuery>;
export type GetAgentHistoriesLazyQueryHookResult = ReturnType<typeof useGetAgentHistoriesLazyQuery>;
export type GetAgentHistoriesSuspenseQueryHookResult = ReturnType<typeof useGetAgentHistoriesSuspenseQuery>;
export type GetAgentHistoriesQueryResult = Apollo.QueryResult<GetAgentHistoriesQuery, GetAgentHistoriesQueryVariables>;
export const AgentConversationsDocument = gql`
    query AgentConversations($filter: AgentConversationFilter, $paging: OffsetPaging, $sorting: [AgentConversationSort!]) {
  agentConversations(filter: $filter, paging: $paging, sorting: $sorting) {
    nodes {
      id
      userId
      title
      createdAt
      updatedAt
    }
    totalCount
  }
}
    `;

/**
 * __useAgentConversationsQuery__
 *
 * To run a query within a React component, call `useAgentConversationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAgentConversationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAgentConversationsQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      paging: // value for 'paging'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function useAgentConversationsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<AgentConversationsQuery, AgentConversationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<AgentConversationsQuery, AgentConversationsQueryVariables>(AgentConversationsDocument, options);
      }
export function useAgentConversationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<AgentConversationsQuery, AgentConversationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<AgentConversationsQuery, AgentConversationsQueryVariables>(AgentConversationsDocument, options);
        }
// @ts-ignore
export function useAgentConversationsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<AgentConversationsQuery, AgentConversationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<AgentConversationsQuery, AgentConversationsQueryVariables>;
export function useAgentConversationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<AgentConversationsQuery, AgentConversationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<AgentConversationsQuery | undefined, AgentConversationsQueryVariables>;
export function useAgentConversationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<AgentConversationsQuery, AgentConversationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<AgentConversationsQuery, AgentConversationsQueryVariables>(AgentConversationsDocument, options);
        }
export type AgentConversationsQueryHookResult = ReturnType<typeof useAgentConversationsQuery>;
export type AgentConversationsLazyQueryHookResult = ReturnType<typeof useAgentConversationsLazyQuery>;
export type AgentConversationsSuspenseQueryHookResult = ReturnType<typeof useAgentConversationsSuspenseQuery>;
export type AgentConversationsQueryResult = Apollo.QueryResult<AgentConversationsQuery, AgentConversationsQueryVariables>;
export const CreateOneAgentConversationDocument = gql`
    mutation CreateOneAgentConversation($input: AgentConversationCreateInput!) {
  createOneAgentConversation(input: {agentConversation: $input}) {
    id
    userId
    title
    createdAt
    updatedAt
  }
}
    `;
export type CreateOneAgentConversationMutationFn = Apollo.MutationFunction<CreateOneAgentConversationMutation, CreateOneAgentConversationMutationVariables>;

/**
 * __useCreateOneAgentConversationMutation__
 *
 * To run a mutation, you first call `useCreateOneAgentConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOneAgentConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOneAgentConversationMutation, { data, loading, error }] = useCreateOneAgentConversationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOneAgentConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateOneAgentConversationMutation, CreateOneAgentConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateOneAgentConversationMutation, CreateOneAgentConversationMutationVariables>(CreateOneAgentConversationDocument, options);
      }
export type CreateOneAgentConversationMutationHookResult = ReturnType<typeof useCreateOneAgentConversationMutation>;
export type CreateOneAgentConversationMutationResult = Apollo.MutationResult<CreateOneAgentConversationMutation>;
export type CreateOneAgentConversationMutationOptions = Apollo.BaseMutationOptions<CreateOneAgentConversationMutation, CreateOneAgentConversationMutationVariables>;
export const DeleteOneAgentConversationDocument = gql`
    mutation DeleteOneAgentConversation($input: DeleteOneAgentConversationInput!) {
  deleteOneAgentConversation(input: $input) {
    id
  }
}
    `;
export type DeleteOneAgentConversationMutationFn = Apollo.MutationFunction<DeleteOneAgentConversationMutation, DeleteOneAgentConversationMutationVariables>;

/**
 * __useDeleteOneAgentConversationMutation__
 *
 * To run a mutation, you first call `useDeleteOneAgentConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteOneAgentConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteOneAgentConversationMutation, { data, loading, error }] = useDeleteOneAgentConversationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteOneAgentConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteOneAgentConversationMutation, DeleteOneAgentConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteOneAgentConversationMutation, DeleteOneAgentConversationMutationVariables>(DeleteOneAgentConversationDocument, options);
      }
export type DeleteOneAgentConversationMutationHookResult = ReturnType<typeof useDeleteOneAgentConversationMutation>;
export type DeleteOneAgentConversationMutationResult = Apollo.MutationResult<DeleteOneAgentConversationMutation>;
export type DeleteOneAgentConversationMutationOptions = Apollo.BaseMutationOptions<DeleteOneAgentConversationMutation, DeleteOneAgentConversationMutationVariables>;
export const CreateAgentDocument = gql`
    mutation CreateAgent($input: AgentCreateInput!) {
  createOneAgent(input: {agent: $input}) {
    id
    name
    instructions
    description
    changeDescription
    tags
    tools
    skills
    modelConfig
    createdAt
    updatedAt
  }
}
    `;
export type CreateAgentMutationFn = Apollo.MutationFunction<CreateAgentMutation, CreateAgentMutationVariables>;

/**
 * __useCreateAgentMutation__
 *
 * To run a mutation, you first call `useCreateAgentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAgentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAgentMutation, { data, loading, error }] = useCreateAgentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAgentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateAgentMutation, CreateAgentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateAgentMutation, CreateAgentMutationVariables>(CreateAgentDocument, options);
      }
export type CreateAgentMutationHookResult = ReturnType<typeof useCreateAgentMutation>;
export type CreateAgentMutationResult = Apollo.MutationResult<CreateAgentMutation>;
export type CreateAgentMutationOptions = Apollo.BaseMutationOptions<CreateAgentMutation, CreateAgentMutationVariables>;
export const UpdateAgentDocument = gql`
    mutation UpdateAgent($input: UpdateOneAgentInput!) {
  updateOneAgent(input: $input) {
    id
    name
    instructions
    description
    changeDescription
    tags
    tools
    skills
    modelConfig
    createdAt
    updatedAt
  }
}
    `;
export type UpdateAgentMutationFn = Apollo.MutationFunction<UpdateAgentMutation, UpdateAgentMutationVariables>;

/**
 * __useUpdateAgentMutation__
 *
 * To run a mutation, you first call `useUpdateAgentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAgentMutation, { data, loading, error }] = useUpdateAgentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAgentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAgentMutation, UpdateAgentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAgentMutation, UpdateAgentMutationVariables>(UpdateAgentDocument, options);
      }
export type UpdateAgentMutationHookResult = ReturnType<typeof useUpdateAgentMutation>;
export type UpdateAgentMutationResult = Apollo.MutationResult<UpdateAgentMutation>;
export type UpdateAgentMutationOptions = Apollo.BaseMutationOptions<UpdateAgentMutation, UpdateAgentMutationVariables>;
export const RollbackAgentHistoryDocument = gql`
    mutation RollbackAgentHistory($agentId: ID!, $historyId: ID!, $changeDescription: String) {
  rollbackAgentHistory(
    agentId: $agentId
    historyId: $historyId
    changeDescription: $changeDescription
  ) {
    id
    name
    instructions
    description
    tags
    tools
    skills
    modelConfig
    createdAt
    updatedAt
  }
}
    `;
export type RollbackAgentHistoryMutationFn = Apollo.MutationFunction<RollbackAgentHistoryMutation, RollbackAgentHistoryMutationVariables>;

/**
 * __useRollbackAgentHistoryMutation__
 *
 * To run a mutation, you first call `useRollbackAgentHistoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRollbackAgentHistoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rollbackAgentHistoryMutation, { data, loading, error }] = useRollbackAgentHistoryMutation({
 *   variables: {
 *      agentId: // value for 'agentId'
 *      historyId: // value for 'historyId'
 *      changeDescription: // value for 'changeDescription'
 *   },
 * });
 */
export function useRollbackAgentHistoryMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RollbackAgentHistoryMutation, RollbackAgentHistoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RollbackAgentHistoryMutation, RollbackAgentHistoryMutationVariables>(RollbackAgentHistoryDocument, options);
      }
export type RollbackAgentHistoryMutationHookResult = ReturnType<typeof useRollbackAgentHistoryMutation>;
export type RollbackAgentHistoryMutationResult = Apollo.MutationResult<RollbackAgentHistoryMutation>;
export type RollbackAgentHistoryMutationOptions = Apollo.BaseMutationOptions<RollbackAgentHistoryMutation, RollbackAgentHistoryMutationVariables>;
export const DeleteAgentHistoryDocument = gql`
    mutation DeleteAgentHistory($input: DeleteOneAgentHistoryInput!) {
  deleteOneAgentHistory(input: $input) {
    id
  }
}
    `;
export type DeleteAgentHistoryMutationFn = Apollo.MutationFunction<DeleteAgentHistoryMutation, DeleteAgentHistoryMutationVariables>;

/**
 * __useDeleteAgentHistoryMutation__
 *
 * To run a mutation, you first call `useDeleteAgentHistoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAgentHistoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAgentHistoryMutation, { data, loading, error }] = useDeleteAgentHistoryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteAgentHistoryMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteAgentHistoryMutation, DeleteAgentHistoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteAgentHistoryMutation, DeleteAgentHistoryMutationVariables>(DeleteAgentHistoryDocument, options);
      }
export type DeleteAgentHistoryMutationHookResult = ReturnType<typeof useDeleteAgentHistoryMutation>;
export type DeleteAgentHistoryMutationResult = Apollo.MutationResult<DeleteAgentHistoryMutation>;
export type DeleteAgentHistoryMutationOptions = Apollo.BaseMutationOptions<DeleteAgentHistoryMutation, DeleteAgentHistoryMutationVariables>;
export const DeleteAgentDocument = gql`
    mutation DeleteAgent($input: DeleteOneAgentInput!) {
  deleteOneAgent(input: $input) {
    id
  }
}
    `;
export type DeleteAgentMutationFn = Apollo.MutationFunction<DeleteAgentMutation, DeleteAgentMutationVariables>;

/**
 * __useDeleteAgentMutation__
 *
 * To run a mutation, you first call `useDeleteAgentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAgentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAgentMutation, { data, loading, error }] = useDeleteAgentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteAgentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteAgentMutation, DeleteAgentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteAgentMutation, DeleteAgentMutationVariables>(DeleteAgentDocument, options);
      }
export type DeleteAgentMutationHookResult = ReturnType<typeof useDeleteAgentMutation>;
export type DeleteAgentMutationResult = Apollo.MutationResult<DeleteAgentMutation>;
export type DeleteAgentMutationOptions = Apollo.BaseMutationOptions<DeleteAgentMutation, DeleteAgentMutationVariables>;
export const GetAppConfigsDocument = gql`
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
    `;

/**
 * __useGetAppConfigsQuery__
 *
 * To run a query within a React component, call `useGetAppConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAppConfigsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAppConfigsQuery, GetAppConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAppConfigsQuery, GetAppConfigsQueryVariables>(GetAppConfigsDocument, options);
      }
export function useGetAppConfigsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAppConfigsQuery, GetAppConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAppConfigsQuery, GetAppConfigsQueryVariables>(GetAppConfigsDocument, options);
        }
// @ts-ignore
export function useGetAppConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAppConfigsQuery, GetAppConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAppConfigsQuery, GetAppConfigsQueryVariables>;
export function useGetAppConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAppConfigsQuery, GetAppConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAppConfigsQuery | undefined, GetAppConfigsQueryVariables>;
export function useGetAppConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAppConfigsQuery, GetAppConfigsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAppConfigsQuery, GetAppConfigsQueryVariables>(GetAppConfigsDocument, options);
        }
export type GetAppConfigsQueryHookResult = ReturnType<typeof useGetAppConfigsQuery>;
export type GetAppConfigsLazyQueryHookResult = ReturnType<typeof useGetAppConfigsLazyQuery>;
export type GetAppConfigsSuspenseQueryHookResult = ReturnType<typeof useGetAppConfigsSuspenseQuery>;
export type GetAppConfigsQueryResult = Apollo.QueryResult<GetAppConfigsQuery, GetAppConfigsQueryVariables>;
export const CreateAppConfigDocument = gql`
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
    `;
export type CreateAppConfigMutationFn = Apollo.MutationFunction<CreateAppConfigMutation, CreateAppConfigMutationVariables>;

/**
 * __useCreateAppConfigMutation__
 *
 * To run a mutation, you first call `useCreateAppConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAppConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAppConfigMutation, { data, loading, error }] = useCreateAppConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAppConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateAppConfigMutation, CreateAppConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateAppConfigMutation, CreateAppConfigMutationVariables>(CreateAppConfigDocument, options);
      }
export type CreateAppConfigMutationHookResult = ReturnType<typeof useCreateAppConfigMutation>;
export type CreateAppConfigMutationResult = Apollo.MutationResult<CreateAppConfigMutation>;
export type CreateAppConfigMutationOptions = Apollo.BaseMutationOptions<CreateAppConfigMutation, CreateAppConfigMutationVariables>;
export const UpdateAppConfigDocument = gql`
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
    `;
export type UpdateAppConfigMutationFn = Apollo.MutationFunction<UpdateAppConfigMutation, UpdateAppConfigMutationVariables>;

/**
 * __useUpdateAppConfigMutation__
 *
 * To run a mutation, you first call `useUpdateAppConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAppConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAppConfigMutation, { data, loading, error }] = useUpdateAppConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAppConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAppConfigMutation, UpdateAppConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAppConfigMutation, UpdateAppConfigMutationVariables>(UpdateAppConfigDocument, options);
      }
export type UpdateAppConfigMutationHookResult = ReturnType<typeof useUpdateAppConfigMutation>;
export type UpdateAppConfigMutationResult = Apollo.MutationResult<UpdateAppConfigMutation>;
export type UpdateAppConfigMutationOptions = Apollo.BaseMutationOptions<UpdateAppConfigMutation, UpdateAppConfigMutationVariables>;
export const DeleteAppConfigDocument = gql`
    mutation DeleteAppConfig($input: DeleteOnePurfenceAppConfigInput!) {
  deleteOnePurfenceAppConfig(input: $input) {
    id
  }
}
    `;
export type DeleteAppConfigMutationFn = Apollo.MutationFunction<DeleteAppConfigMutation, DeleteAppConfigMutationVariables>;

/**
 * __useDeleteAppConfigMutation__
 *
 * To run a mutation, you first call `useDeleteAppConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAppConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAppConfigMutation, { data, loading, error }] = useDeleteAppConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteAppConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteAppConfigMutation, DeleteAppConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteAppConfigMutation, DeleteAppConfigMutationVariables>(DeleteAppConfigDocument, options);
      }
export type DeleteAppConfigMutationHookResult = ReturnType<typeof useDeleteAppConfigMutation>;
export type DeleteAppConfigMutationResult = Apollo.MutationResult<DeleteAppConfigMutation>;
export type DeleteAppConfigMutationOptions = Apollo.BaseMutationOptions<DeleteAppConfigMutation, DeleteAppConfigMutationVariables>;
export const GetProviderConfigsDocument = gql`
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
    `;

/**
 * __useGetProviderConfigsQuery__
 *
 * To run a query within a React component, call `useGetProviderConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProviderConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProviderConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetProviderConfigsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>(GetProviderConfigsDocument, options);
      }
export function useGetProviderConfigsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>(GetProviderConfigsDocument, options);
        }
// @ts-ignore
export function useGetProviderConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>;
export function useGetProviderConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProviderConfigsQuery | undefined, GetProviderConfigsQueryVariables>;
export function useGetProviderConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>(GetProviderConfigsDocument, options);
        }
export type GetProviderConfigsQueryHookResult = ReturnType<typeof useGetProviderConfigsQuery>;
export type GetProviderConfigsLazyQueryHookResult = ReturnType<typeof useGetProviderConfigsLazyQuery>;
export type GetProviderConfigsSuspenseQueryHookResult = ReturnType<typeof useGetProviderConfigsSuspenseQuery>;
export type GetProviderConfigsQueryResult = Apollo.QueryResult<GetProviderConfigsQuery, GetProviderConfigsQueryVariables>;
export const GetProviderConfigDocument = gql`
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
    `;

/**
 * __useGetProviderConfigQuery__
 *
 * To run a query within a React component, call `useGetProviderConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProviderConfigQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProviderConfigQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProviderConfigQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProviderConfigQuery, GetProviderConfigQueryVariables> & ({ variables: GetProviderConfigQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProviderConfigQuery, GetProviderConfigQueryVariables>(GetProviderConfigDocument, options);
      }
export function useGetProviderConfigLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProviderConfigQuery, GetProviderConfigQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProviderConfigQuery, GetProviderConfigQueryVariables>(GetProviderConfigDocument, options);
        }
// @ts-ignore
export function useGetProviderConfigSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigQuery, GetProviderConfigQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProviderConfigQuery, GetProviderConfigQueryVariables>;
export function useGetProviderConfigSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigQuery, GetProviderConfigQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetProviderConfigQuery | undefined, GetProviderConfigQueryVariables>;
export function useGetProviderConfigSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProviderConfigQuery, GetProviderConfigQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProviderConfigQuery, GetProviderConfigQueryVariables>(GetProviderConfigDocument, options);
        }
export type GetProviderConfigQueryHookResult = ReturnType<typeof useGetProviderConfigQuery>;
export type GetProviderConfigLazyQueryHookResult = ReturnType<typeof useGetProviderConfigLazyQuery>;
export type GetProviderConfigSuspenseQueryHookResult = ReturnType<typeof useGetProviderConfigSuspenseQuery>;
export type GetProviderConfigQueryResult = Apollo.QueryResult<GetProviderConfigQuery, GetProviderConfigQueryVariables>;
export const CreateProviderConfigDocument = gql`
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
    `;
export type CreateProviderConfigMutationFn = Apollo.MutationFunction<CreateProviderConfigMutation, CreateProviderConfigMutationVariables>;

/**
 * __useCreateProviderConfigMutation__
 *
 * To run a mutation, you first call `useCreateProviderConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProviderConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProviderConfigMutation, { data, loading, error }] = useCreateProviderConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProviderConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateProviderConfigMutation, CreateProviderConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateProviderConfigMutation, CreateProviderConfigMutationVariables>(CreateProviderConfigDocument, options);
      }
export type CreateProviderConfigMutationHookResult = ReturnType<typeof useCreateProviderConfigMutation>;
export type CreateProviderConfigMutationResult = Apollo.MutationResult<CreateProviderConfigMutation>;
export type CreateProviderConfigMutationOptions = Apollo.BaseMutationOptions<CreateProviderConfigMutation, CreateProviderConfigMutationVariables>;
export const UpdateProviderConfigDocument = gql`
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
    `;
export type UpdateProviderConfigMutationFn = Apollo.MutationFunction<UpdateProviderConfigMutation, UpdateProviderConfigMutationVariables>;

/**
 * __useUpdateProviderConfigMutation__
 *
 * To run a mutation, you first call `useUpdateProviderConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProviderConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProviderConfigMutation, { data, loading, error }] = useUpdateProviderConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProviderConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProviderConfigMutation, UpdateProviderConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProviderConfigMutation, UpdateProviderConfigMutationVariables>(UpdateProviderConfigDocument, options);
      }
export type UpdateProviderConfigMutationHookResult = ReturnType<typeof useUpdateProviderConfigMutation>;
export type UpdateProviderConfigMutationResult = Apollo.MutationResult<UpdateProviderConfigMutation>;
export type UpdateProviderConfigMutationOptions = Apollo.BaseMutationOptions<UpdateProviderConfigMutation, UpdateProviderConfigMutationVariables>;
export const DeleteProviderConfigDocument = gql`
    mutation DeleteProviderConfig($input: DeleteOneModelProviderInput!) {
  deleteOneModelProvider(input: $input) {
    id
  }
}
    `;
export type DeleteProviderConfigMutationFn = Apollo.MutationFunction<DeleteProviderConfigMutation, DeleteProviderConfigMutationVariables>;

/**
 * __useDeleteProviderConfigMutation__
 *
 * To run a mutation, you first call `useDeleteProviderConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProviderConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProviderConfigMutation, { data, loading, error }] = useDeleteProviderConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteProviderConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteProviderConfigMutation, DeleteProviderConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteProviderConfigMutation, DeleteProviderConfigMutationVariables>(DeleteProviderConfigDocument, options);
      }
export type DeleteProviderConfigMutationHookResult = ReturnType<typeof useDeleteProviderConfigMutation>;
export type DeleteProviderConfigMutationResult = Apollo.MutationResult<DeleteProviderConfigMutation>;
export type DeleteProviderConfigMutationOptions = Apollo.BaseMutationOptions<DeleteProviderConfigMutation, DeleteProviderConfigMutationVariables>;
export const GetAllPurfenceConfigsDocument = gql`
    query GetAllPurfenceConfigs {
  purfenceConfigs(paging: {limit: 50}) {
    nodes {
      id
      key
      value
      createdAt
      updatedAt
    }
  }
}
    `;

/**
 * __useGetAllPurfenceConfigsQuery__
 *
 * To run a query within a React component, call `useGetAllPurfenceConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllPurfenceConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllPurfenceConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAllPurfenceConfigsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>(GetAllPurfenceConfigsDocument, options);
      }
export function useGetAllPurfenceConfigsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>(GetAllPurfenceConfigsDocument, options);
        }
// @ts-ignore
export function useGetAllPurfenceConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>;
export function useGetAllPurfenceConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetAllPurfenceConfigsQuery | undefined, GetAllPurfenceConfigsQueryVariables>;
export function useGetAllPurfenceConfigsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>(GetAllPurfenceConfigsDocument, options);
        }
export type GetAllPurfenceConfigsQueryHookResult = ReturnType<typeof useGetAllPurfenceConfigsQuery>;
export type GetAllPurfenceConfigsLazyQueryHookResult = ReturnType<typeof useGetAllPurfenceConfigsLazyQuery>;
export type GetAllPurfenceConfigsSuspenseQueryHookResult = ReturnType<typeof useGetAllPurfenceConfigsSuspenseQuery>;
export type GetAllPurfenceConfigsQueryResult = Apollo.QueryResult<GetAllPurfenceConfigsQuery, GetAllPurfenceConfigsQueryVariables>;
export const CreatePurfenceConfigDocument = gql`
    mutation CreatePurfenceConfig($input: CreateOnePurfenceConfigInput!) {
  createOnePurfenceConfig(input: $input) {
    id
    key
    value
    createdAt
    updatedAt
  }
}
    `;
export type CreatePurfenceConfigMutationFn = Apollo.MutationFunction<CreatePurfenceConfigMutation, CreatePurfenceConfigMutationVariables>;

/**
 * __useCreatePurfenceConfigMutation__
 *
 * To run a mutation, you first call `useCreatePurfenceConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePurfenceConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPurfenceConfigMutation, { data, loading, error }] = useCreatePurfenceConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePurfenceConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePurfenceConfigMutation, CreatePurfenceConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePurfenceConfigMutation, CreatePurfenceConfigMutationVariables>(CreatePurfenceConfigDocument, options);
      }
export type CreatePurfenceConfigMutationHookResult = ReturnType<typeof useCreatePurfenceConfigMutation>;
export type CreatePurfenceConfigMutationResult = Apollo.MutationResult<CreatePurfenceConfigMutation>;
export type CreatePurfenceConfigMutationOptions = Apollo.BaseMutationOptions<CreatePurfenceConfigMutation, CreatePurfenceConfigMutationVariables>;
export const UpdatePurfenceConfigDocument = gql`
    mutation UpdatePurfenceConfig($input: UpdateOnePurfenceConfigInput!) {
  updateOnePurfenceConfig(input: $input) {
    id
    key
    value
    createdAt
    updatedAt
  }
}
    `;
export type UpdatePurfenceConfigMutationFn = Apollo.MutationFunction<UpdatePurfenceConfigMutation, UpdatePurfenceConfigMutationVariables>;

/**
 * __useUpdatePurfenceConfigMutation__
 *
 * To run a mutation, you first call `useUpdatePurfenceConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePurfenceConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePurfenceConfigMutation, { data, loading, error }] = useUpdatePurfenceConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePurfenceConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePurfenceConfigMutation, UpdatePurfenceConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePurfenceConfigMutation, UpdatePurfenceConfigMutationVariables>(UpdatePurfenceConfigDocument, options);
      }
export type UpdatePurfenceConfigMutationHookResult = ReturnType<typeof useUpdatePurfenceConfigMutation>;
export type UpdatePurfenceConfigMutationResult = Apollo.MutationResult<UpdatePurfenceConfigMutation>;
export type UpdatePurfenceConfigMutationOptions = Apollo.BaseMutationOptions<UpdatePurfenceConfigMutation, UpdatePurfenceConfigMutationVariables>;
export const CreateOnePurfenceProjectDocument = gql`
    mutation CreateOnePurfenceProject($input: CreateOnePurfenceProjectInput!) {
  createOnePurfenceProject(input: $input) {
    id
    name
    description
    localRootPath
    externalPath
    defaultBranch
    slackAppConfigId
    slackChannelId
    createdAt
    updatedAt
  }
}
    `;
export type CreateOnePurfenceProjectMutationFn = Apollo.MutationFunction<CreateOnePurfenceProjectMutation, CreateOnePurfenceProjectMutationVariables>;

/**
 * __useCreateOnePurfenceProjectMutation__
 *
 * To run a mutation, you first call `useCreateOnePurfenceProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOnePurfenceProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOnePurfenceProjectMutation, { data, loading, error }] = useCreateOnePurfenceProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOnePurfenceProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateOnePurfenceProjectMutation, CreateOnePurfenceProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateOnePurfenceProjectMutation, CreateOnePurfenceProjectMutationVariables>(CreateOnePurfenceProjectDocument, options);
      }
export type CreateOnePurfenceProjectMutationHookResult = ReturnType<typeof useCreateOnePurfenceProjectMutation>;
export type CreateOnePurfenceProjectMutationResult = Apollo.MutationResult<CreateOnePurfenceProjectMutation>;
export type CreateOnePurfenceProjectMutationOptions = Apollo.BaseMutationOptions<CreateOnePurfenceProjectMutation, CreateOnePurfenceProjectMutationVariables>;
export const UpdateOnePurfenceProjectDocument = gql`
    mutation UpdateOnePurfenceProject($input: UpdateOnePurfenceProjectInput!) {
  updateOnePurfenceProject(input: $input) {
    id
    name
    description
    slackAppConfigId
    slackChannelId
    updatedAt
  }
}
    `;
export type UpdateOnePurfenceProjectMutationFn = Apollo.MutationFunction<UpdateOnePurfenceProjectMutation, UpdateOnePurfenceProjectMutationVariables>;

/**
 * __useUpdateOnePurfenceProjectMutation__
 *
 * To run a mutation, you first call `useUpdateOnePurfenceProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOnePurfenceProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOnePurfenceProjectMutation, { data, loading, error }] = useUpdateOnePurfenceProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateOnePurfenceProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateOnePurfenceProjectMutation, UpdateOnePurfenceProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateOnePurfenceProjectMutation, UpdateOnePurfenceProjectMutationVariables>(UpdateOnePurfenceProjectDocument, options);
      }
export type UpdateOnePurfenceProjectMutationHookResult = ReturnType<typeof useUpdateOnePurfenceProjectMutation>;
export type UpdateOnePurfenceProjectMutationResult = Apollo.MutationResult<UpdateOnePurfenceProjectMutation>;
export type UpdateOnePurfenceProjectMutationOptions = Apollo.BaseMutationOptions<UpdateOnePurfenceProjectMutation, UpdateOnePurfenceProjectMutationVariables>;
export const CreateOnePurfenceIssueDocument = gql`
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
    `;
export type CreateOnePurfenceIssueMutationFn = Apollo.MutationFunction<CreateOnePurfenceIssueMutation, CreateOnePurfenceIssueMutationVariables>;

/**
 * __useCreateOnePurfenceIssueMutation__
 *
 * To run a mutation, you first call `useCreateOnePurfenceIssueMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOnePurfenceIssueMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOnePurfenceIssueMutation, { data, loading, error }] = useCreateOnePurfenceIssueMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOnePurfenceIssueMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateOnePurfenceIssueMutation, CreateOnePurfenceIssueMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateOnePurfenceIssueMutation, CreateOnePurfenceIssueMutationVariables>(CreateOnePurfenceIssueDocument, options);
      }
export type CreateOnePurfenceIssueMutationHookResult = ReturnType<typeof useCreateOnePurfenceIssueMutation>;
export type CreateOnePurfenceIssueMutationResult = Apollo.MutationResult<CreateOnePurfenceIssueMutation>;
export type CreateOnePurfenceIssueMutationOptions = Apollo.BaseMutationOptions<CreateOnePurfenceIssueMutation, CreateOnePurfenceIssueMutationVariables>;
export const PurfenceProjectsDocument = gql`
    query PurfenceProjects($paging: OffsetPaging, $filter: PurfenceProjectFilter, $sorting: [PurfenceProjectSort!]) {
  purfenceProjects(paging: $paging, filter: $filter, sorting: $sorting) {
    nodes {
      id
      name
      description
      localRootPath
      slackAppConfigId
      slackChannelId
      createdAt
      updatedAt
    }
    totalCount
  }
}
    `;

/**
 * __usePurfenceProjectsQuery__
 *
 * To run a query within a React component, call `usePurfenceProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceProjectsQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      filter: // value for 'filter'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function usePurfenceProjectsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>(PurfenceProjectsDocument, options);
      }
export function usePurfenceProjectsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>(PurfenceProjectsDocument, options);
        }
// @ts-ignore
export function usePurfenceProjectsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>;
export function usePurfenceProjectsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceProjectsQuery | undefined, PurfenceProjectsQueryVariables>;
export function usePurfenceProjectsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>(PurfenceProjectsDocument, options);
        }
export type PurfenceProjectsQueryHookResult = ReturnType<typeof usePurfenceProjectsQuery>;
export type PurfenceProjectsLazyQueryHookResult = ReturnType<typeof usePurfenceProjectsLazyQuery>;
export type PurfenceProjectsSuspenseQueryHookResult = ReturnType<typeof usePurfenceProjectsSuspenseQuery>;
export type PurfenceProjectsQueryResult = Apollo.QueryResult<PurfenceProjectsQuery, PurfenceProjectsQueryVariables>;
export const PurfenceIssueDocument = gql`
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
    `;

/**
 * __usePurfenceIssueQuery__
 *
 * To run a query within a React component, call `usePurfenceIssueQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceIssueQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceIssueQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePurfenceIssueQuery(baseOptions: ApolloReactHooks.QueryHookOptions<PurfenceIssueQuery, PurfenceIssueQueryVariables> & ({ variables: PurfenceIssueQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceIssueQuery, PurfenceIssueQueryVariables>(PurfenceIssueDocument, options);
      }
export function usePurfenceIssueLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceIssueQuery, PurfenceIssueQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceIssueQuery, PurfenceIssueQueryVariables>(PurfenceIssueDocument, options);
        }
// @ts-ignore
export function usePurfenceIssueSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssueQuery, PurfenceIssueQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceIssueQuery, PurfenceIssueQueryVariables>;
export function usePurfenceIssueSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssueQuery, PurfenceIssueQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceIssueQuery | undefined, PurfenceIssueQueryVariables>;
export function usePurfenceIssueSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssueQuery, PurfenceIssueQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceIssueQuery, PurfenceIssueQueryVariables>(PurfenceIssueDocument, options);
        }
export type PurfenceIssueQueryHookResult = ReturnType<typeof usePurfenceIssueQuery>;
export type PurfenceIssueLazyQueryHookResult = ReturnType<typeof usePurfenceIssueLazyQuery>;
export type PurfenceIssueSuspenseQueryHookResult = ReturnType<typeof usePurfenceIssueSuspenseQuery>;
export type PurfenceIssueQueryResult = Apollo.QueryResult<PurfenceIssueQuery, PurfenceIssueQueryVariables>;
export const PurfenceProjectDocument = gql`
    query PurfenceProject($id: ID!) {
  purfenceProject(id: $id) {
    id
    name
    description
    localRootPath
    slackAppConfigId
    slackChannelId
    createdAt
    updatedAt
  }
}
    `;

/**
 * __usePurfenceProjectQuery__
 *
 * To run a query within a React component, call `usePurfenceProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceProjectQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePurfenceProjectQuery(baseOptions: ApolloReactHooks.QueryHookOptions<PurfenceProjectQuery, PurfenceProjectQueryVariables> & ({ variables: PurfenceProjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceProjectQuery, PurfenceProjectQueryVariables>(PurfenceProjectDocument, options);
      }
export function usePurfenceProjectLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceProjectQuery, PurfenceProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceProjectQuery, PurfenceProjectQueryVariables>(PurfenceProjectDocument, options);
        }
// @ts-ignore
export function usePurfenceProjectSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectQuery, PurfenceProjectQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceProjectQuery, PurfenceProjectQueryVariables>;
export function usePurfenceProjectSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectQuery, PurfenceProjectQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceProjectQuery | undefined, PurfenceProjectQueryVariables>;
export function usePurfenceProjectSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceProjectQuery, PurfenceProjectQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceProjectQuery, PurfenceProjectQueryVariables>(PurfenceProjectDocument, options);
        }
export type PurfenceProjectQueryHookResult = ReturnType<typeof usePurfenceProjectQuery>;
export type PurfenceProjectLazyQueryHookResult = ReturnType<typeof usePurfenceProjectLazyQuery>;
export type PurfenceProjectSuspenseQueryHookResult = ReturnType<typeof usePurfenceProjectSuspenseQuery>;
export type PurfenceProjectQueryResult = Apollo.QueryResult<PurfenceProjectQuery, PurfenceProjectQueryVariables>;
export const PurfenceIssuesDocument = gql`
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
    `;

/**
 * __usePurfenceIssuesQuery__
 *
 * To run a query within a React component, call `usePurfenceIssuesQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceIssuesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceIssuesQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      filter: // value for 'filter'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function usePurfenceIssuesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>(PurfenceIssuesDocument, options);
      }
export function usePurfenceIssuesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>(PurfenceIssuesDocument, options);
        }
// @ts-ignore
export function usePurfenceIssuesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>;
export function usePurfenceIssuesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceIssuesQuery | undefined, PurfenceIssuesQueryVariables>;
export function usePurfenceIssuesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>(PurfenceIssuesDocument, options);
        }
export type PurfenceIssuesQueryHookResult = ReturnType<typeof usePurfenceIssuesQuery>;
export type PurfenceIssuesLazyQueryHookResult = ReturnType<typeof usePurfenceIssuesLazyQuery>;
export type PurfenceIssuesSuspenseQueryHookResult = ReturnType<typeof usePurfenceIssuesSuspenseQuery>;
export type PurfenceIssuesQueryResult = Apollo.QueryResult<PurfenceIssuesQuery, PurfenceIssuesQueryVariables>;
export const PurfenceExecutionsDocument = gql`
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
    `;

/**
 * __usePurfenceExecutionsQuery__
 *
 * To run a query within a React component, call `usePurfenceExecutionsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceExecutionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceExecutionsQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      filter: // value for 'filter'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function usePurfenceExecutionsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>(PurfenceExecutionsDocument, options);
      }
export function usePurfenceExecutionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>(PurfenceExecutionsDocument, options);
        }
// @ts-ignore
export function usePurfenceExecutionsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>;
export function usePurfenceExecutionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceExecutionsQuery | undefined, PurfenceExecutionsQueryVariables>;
export function usePurfenceExecutionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>(PurfenceExecutionsDocument, options);
        }
export type PurfenceExecutionsQueryHookResult = ReturnType<typeof usePurfenceExecutionsQuery>;
export type PurfenceExecutionsLazyQueryHookResult = ReturnType<typeof usePurfenceExecutionsLazyQuery>;
export type PurfenceExecutionsSuspenseQueryHookResult = ReturnType<typeof usePurfenceExecutionsSuspenseQuery>;
export type PurfenceExecutionsQueryResult = Apollo.QueryResult<PurfenceExecutionsQuery, PurfenceExecutionsQueryVariables>;
export const DeleteOnePurfenceIssueDocument = gql`
    mutation DeleteOnePurfenceIssue($input: DeleteOnePurfenceIssueInput!) {
  deleteOnePurfenceIssue(input: $input)
}
    `;
export type DeleteOnePurfenceIssueMutationFn = Apollo.MutationFunction<DeleteOnePurfenceIssueMutation, DeleteOnePurfenceIssueMutationVariables>;

/**
 * __useDeleteOnePurfenceIssueMutation__
 *
 * To run a mutation, you first call `useDeleteOnePurfenceIssueMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteOnePurfenceIssueMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteOnePurfenceIssueMutation, { data, loading, error }] = useDeleteOnePurfenceIssueMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteOnePurfenceIssueMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteOnePurfenceIssueMutation, DeleteOnePurfenceIssueMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteOnePurfenceIssueMutation, DeleteOnePurfenceIssueMutationVariables>(DeleteOnePurfenceIssueDocument, options);
      }
export type DeleteOnePurfenceIssueMutationHookResult = ReturnType<typeof useDeleteOnePurfenceIssueMutation>;
export type DeleteOnePurfenceIssueMutationResult = Apollo.MutationResult<DeleteOnePurfenceIssueMutation>;
export type DeleteOnePurfenceIssueMutationOptions = Apollo.BaseMutationOptions<DeleteOnePurfenceIssueMutation, DeleteOnePurfenceIssueMutationVariables>;
export const StartIssueDocument = gql`
    mutation StartIssue($id: ID!) {
  startIssue(id: $id)
}
    `;
export type StartIssueMutationFn = Apollo.MutationFunction<StartIssueMutation, StartIssueMutationVariables>;

/**
 * __useStartIssueMutation__
 *
 * To run a mutation, you first call `useStartIssueMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartIssueMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startIssueMutation, { data, loading, error }] = useStartIssueMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useStartIssueMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<StartIssueMutation, StartIssueMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<StartIssueMutation, StartIssueMutationVariables>(StartIssueDocument, options);
      }
export type StartIssueMutationHookResult = ReturnType<typeof useStartIssueMutation>;
export type StartIssueMutationResult = Apollo.MutationResult<StartIssueMutation>;
export type StartIssueMutationOptions = Apollo.BaseMutationOptions<StartIssueMutation, StartIssueMutationVariables>;
export const MyQueuesDocument = gql`
    query MyQueues($paging: OffsetPaging!, $filter: MyQueueFilter!, $sorting: [MyQueueSort!]!) {
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
    `;

/**
 * __useMyQueuesQuery__
 *
 * To run a query within a React component, call `useMyQueuesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyQueuesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyQueuesQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      filter: // value for 'filter'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function useMyQueuesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<MyQueuesQuery, MyQueuesQueryVariables> & ({ variables: MyQueuesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MyQueuesQuery, MyQueuesQueryVariables>(MyQueuesDocument, options);
      }
export function useMyQueuesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MyQueuesQuery, MyQueuesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MyQueuesQuery, MyQueuesQueryVariables>(MyQueuesDocument, options);
        }
// @ts-ignore
export function useMyQueuesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<MyQueuesQuery, MyQueuesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueuesQuery, MyQueuesQueryVariables>;
export function useMyQueuesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueuesQuery, MyQueuesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueuesQuery | undefined, MyQueuesQueryVariables>;
export function useMyQueuesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueuesQuery, MyQueuesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<MyQueuesQuery, MyQueuesQueryVariables>(MyQueuesDocument, options);
        }
export type MyQueuesQueryHookResult = ReturnType<typeof useMyQueuesQuery>;
export type MyQueuesLazyQueryHookResult = ReturnType<typeof useMyQueuesLazyQuery>;
export type MyQueuesSuspenseQueryHookResult = ReturnType<typeof useMyQueuesSuspenseQuery>;
export type MyQueuesQueryResult = Apollo.QueryResult<MyQueuesQuery, MyQueuesQueryVariables>;
export const MyQueueJobsDocument = gql`
    query MyQueueJobs($paging: OffsetPaging!, $filter: MyQueueJobFilter!, $sorting: [MyQueueJobSort!]!) {
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
    `;

/**
 * __useMyQueueJobsQuery__
 *
 * To run a query within a React component, call `useMyQueueJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyQueueJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyQueueJobsQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      filter: // value for 'filter'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function useMyQueueJobsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<MyQueueJobsQuery, MyQueueJobsQueryVariables> & ({ variables: MyQueueJobsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MyQueueJobsQuery, MyQueueJobsQueryVariables>(MyQueueJobsDocument, options);
      }
export function useMyQueueJobsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MyQueueJobsQuery, MyQueueJobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MyQueueJobsQuery, MyQueueJobsQueryVariables>(MyQueueJobsDocument, options);
        }
// @ts-ignore
export function useMyQueueJobsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<MyQueueJobsQuery, MyQueueJobsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueueJobsQuery, MyQueueJobsQueryVariables>;
export function useMyQueueJobsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueueJobsQuery, MyQueueJobsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueueJobsQuery | undefined, MyQueueJobsQueryVariables>;
export function useMyQueueJobsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueueJobsQuery, MyQueueJobsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<MyQueueJobsQuery, MyQueueJobsQueryVariables>(MyQueueJobsDocument, options);
        }
export type MyQueueJobsQueryHookResult = ReturnType<typeof useMyQueueJobsQuery>;
export type MyQueueJobsLazyQueryHookResult = ReturnType<typeof useMyQueueJobsLazyQuery>;
export type MyQueueJobsSuspenseQueryHookResult = ReturnType<typeof useMyQueueJobsSuspenseQuery>;
export type MyQueueJobsQueryResult = Apollo.QueryResult<MyQueueJobsQuery, MyQueueJobsQueryVariables>;
export const MyQueueStatsDocument = gql`
    query MyQueueStats($queueId: String!) {
  total: myQueueJobs(
    paging: {offset: 0, limit: 1}
    filter: {queueId: {eq: $queueId}}
    sorting: [{field: createdAt, direction: DESC}]
  ) {
    totalCount
  }
  pending: myQueueJobs(
    paging: {offset: 0, limit: 1}
    filter: {queueId: {eq: $queueId}, status: {eq: pending}}
    sorting: [{field: createdAt, direction: DESC}]
  ) {
    totalCount
  }
  running: myQueueJobs(
    paging: {offset: 0, limit: 1}
    filter: {queueId: {eq: $queueId}, status: {eq: running}}
    sorting: [{field: createdAt, direction: DESC}]
  ) {
    totalCount
  }
  succeeded: myQueueJobs(
    paging: {offset: 0, limit: 1}
    filter: {queueId: {eq: $queueId}, status: {eq: succeeded}}
    sorting: [{field: createdAt, direction: DESC}]
  ) {
    totalCount
  }
  failed: myQueueJobs(
    paging: {offset: 0, limit: 1}
    filter: {queueId: {eq: $queueId}, status: {eq: failed}}
    sorting: [{field: createdAt, direction: DESC}]
  ) {
    totalCount
  }
}
    `;

/**
 * __useMyQueueStatsQuery__
 *
 * To run a query within a React component, call `useMyQueueStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyQueueStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyQueueStatsQuery({
 *   variables: {
 *      queueId: // value for 'queueId'
 *   },
 * });
 */
export function useMyQueueStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<MyQueueStatsQuery, MyQueueStatsQueryVariables> & ({ variables: MyQueueStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MyQueueStatsQuery, MyQueueStatsQueryVariables>(MyQueueStatsDocument, options);
      }
export function useMyQueueStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MyQueueStatsQuery, MyQueueStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MyQueueStatsQuery, MyQueueStatsQueryVariables>(MyQueueStatsDocument, options);
        }
// @ts-ignore
export function useMyQueueStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<MyQueueStatsQuery, MyQueueStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueueStatsQuery, MyQueueStatsQueryVariables>;
export function useMyQueueStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueueStatsQuery, MyQueueStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<MyQueueStatsQuery | undefined, MyQueueStatsQueryVariables>;
export function useMyQueueStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MyQueueStatsQuery, MyQueueStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<MyQueueStatsQuery, MyQueueStatsQueryVariables>(MyQueueStatsDocument, options);
        }
export type MyQueueStatsQueryHookResult = ReturnType<typeof useMyQueueStatsQuery>;
export type MyQueueStatsLazyQueryHookResult = ReturnType<typeof useMyQueueStatsLazyQuery>;
export type MyQueueStatsSuspenseQueryHookResult = ReturnType<typeof useMyQueueStatsSuspenseQuery>;
export type MyQueueStatsQueryResult = Apollo.QueryResult<MyQueueStatsQuery, MyQueueStatsQueryVariables>;
export const UpdateMyQueueDocument = gql`
    mutation UpdateMyQueue($input: UpdateOneMyQueueInput!) {
  updateOneMyQueue(input: $input) {
    id
    name
    maxConcurrency
    attempts
    isPaused
  }
}
    `;
export type UpdateMyQueueMutationFn = Apollo.MutationFunction<UpdateMyQueueMutation, UpdateMyQueueMutationVariables>;

/**
 * __useUpdateMyQueueMutation__
 *
 * To run a mutation, you first call `useUpdateMyQueueMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMyQueueMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMyQueueMutation, { data, loading, error }] = useUpdateMyQueueMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateMyQueueMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMyQueueMutation, UpdateMyQueueMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMyQueueMutation, UpdateMyQueueMutationVariables>(UpdateMyQueueDocument, options);
      }
export type UpdateMyQueueMutationHookResult = ReturnType<typeof useUpdateMyQueueMutation>;
export type UpdateMyQueueMutationResult = Apollo.MutationResult<UpdateMyQueueMutation>;
export type UpdateMyQueueMutationOptions = Apollo.BaseMutationOptions<UpdateMyQueueMutation, UpdateMyQueueMutationVariables>;
export const CreateMyQueueJobDocument = gql`
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
    `;
export type CreateMyQueueJobMutationFn = Apollo.MutationFunction<CreateMyQueueJobMutation, CreateMyQueueJobMutationVariables>;

/**
 * __useCreateMyQueueJobMutation__
 *
 * To run a mutation, you first call `useCreateMyQueueJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMyQueueJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMyQueueJobMutation, { data, loading, error }] = useCreateMyQueueJobMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateMyQueueJobMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateMyQueueJobMutation, CreateMyQueueJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateMyQueueJobMutation, CreateMyQueueJobMutationVariables>(CreateMyQueueJobDocument, options);
      }
export type CreateMyQueueJobMutationHookResult = ReturnType<typeof useCreateMyQueueJobMutation>;
export type CreateMyQueueJobMutationResult = Apollo.MutationResult<CreateMyQueueJobMutation>;
export type CreateMyQueueJobMutationOptions = Apollo.BaseMutationOptions<CreateMyQueueJobMutation, CreateMyQueueJobMutationVariables>;
export const DeleteMyQueueJobDocument = gql`
    mutation DeleteMyQueueJob($input: DeleteOneMyQueueJobInput!) {
  deleteOneMyQueueJob(input: $input) {
    id
  }
}
    `;
export type DeleteMyQueueJobMutationFn = Apollo.MutationFunction<DeleteMyQueueJobMutation, DeleteMyQueueJobMutationVariables>;

/**
 * __useDeleteMyQueueJobMutation__
 *
 * To run a mutation, you first call `useDeleteMyQueueJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMyQueueJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMyQueueJobMutation, { data, loading, error }] = useDeleteMyQueueJobMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteMyQueueJobMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteMyQueueJobMutation, DeleteMyQueueJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteMyQueueJobMutation, DeleteMyQueueJobMutationVariables>(DeleteMyQueueJobDocument, options);
      }
export type DeleteMyQueueJobMutationHookResult = ReturnType<typeof useDeleteMyQueueJobMutation>;
export type DeleteMyQueueJobMutationResult = Apollo.MutationResult<DeleteMyQueueJobMutation>;
export type DeleteMyQueueJobMutationOptions = Apollo.BaseMutationOptions<DeleteMyQueueJobMutation, DeleteMyQueueJobMutationVariables>;
export const PurfenceScheduledTasksDocument = gql`
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
    `;

/**
 * __usePurfenceScheduledTasksQuery__
 *
 * To run a query within a React component, call `usePurfenceScheduledTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `usePurfenceScheduledTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePurfenceScheduledTasksQuery({
 *   variables: {
 *      paging: // value for 'paging'
 *      sorting: // value for 'sorting'
 *   },
 * });
 */
export function usePurfenceScheduledTasksQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>(PurfenceScheduledTasksDocument, options);
      }
export function usePurfenceScheduledTasksLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>(PurfenceScheduledTasksDocument, options);
        }
// @ts-ignore
export function usePurfenceScheduledTasksSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>;
export function usePurfenceScheduledTasksSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<PurfenceScheduledTasksQuery | undefined, PurfenceScheduledTasksQueryVariables>;
export function usePurfenceScheduledTasksSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>(PurfenceScheduledTasksDocument, options);
        }
export type PurfenceScheduledTasksQueryHookResult = ReturnType<typeof usePurfenceScheduledTasksQuery>;
export type PurfenceScheduledTasksLazyQueryHookResult = ReturnType<typeof usePurfenceScheduledTasksLazyQuery>;
export type PurfenceScheduledTasksSuspenseQueryHookResult = ReturnType<typeof usePurfenceScheduledTasksSuspenseQuery>;
export type PurfenceScheduledTasksQueryResult = Apollo.QueryResult<PurfenceScheduledTasksQuery, PurfenceScheduledTasksQueryVariables>;
export const CreatePurfenceScheduledTaskDocument = gql`
    mutation CreatePurfenceScheduledTask($input: PurfenceScheduledTaskCreateInput!) {
  createPurfenceScheduledTask(input: $input) {
    id
  }
}
    `;
export type CreatePurfenceScheduledTaskMutationFn = Apollo.MutationFunction<CreatePurfenceScheduledTaskMutation, CreatePurfenceScheduledTaskMutationVariables>;

/**
 * __useCreatePurfenceScheduledTaskMutation__
 *
 * To run a mutation, you first call `useCreatePurfenceScheduledTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePurfenceScheduledTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPurfenceScheduledTaskMutation, { data, loading, error }] = useCreatePurfenceScheduledTaskMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePurfenceScheduledTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePurfenceScheduledTaskMutation, CreatePurfenceScheduledTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePurfenceScheduledTaskMutation, CreatePurfenceScheduledTaskMutationVariables>(CreatePurfenceScheduledTaskDocument, options);
      }
export type CreatePurfenceScheduledTaskMutationHookResult = ReturnType<typeof useCreatePurfenceScheduledTaskMutation>;
export type CreatePurfenceScheduledTaskMutationResult = Apollo.MutationResult<CreatePurfenceScheduledTaskMutation>;
export type CreatePurfenceScheduledTaskMutationOptions = Apollo.BaseMutationOptions<CreatePurfenceScheduledTaskMutation, CreatePurfenceScheduledTaskMutationVariables>;
export const UpdatePurfenceScheduledTaskDocument = gql`
    mutation UpdatePurfenceScheduledTask($id: ID!, $update: PurfenceScheduledTaskUpdateInput!) {
  updatePurfenceScheduledTask(id: $id, update: $update) {
    id
  }
}
    `;
export type UpdatePurfenceScheduledTaskMutationFn = Apollo.MutationFunction<UpdatePurfenceScheduledTaskMutation, UpdatePurfenceScheduledTaskMutationVariables>;

/**
 * __useUpdatePurfenceScheduledTaskMutation__
 *
 * To run a mutation, you first call `useUpdatePurfenceScheduledTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePurfenceScheduledTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePurfenceScheduledTaskMutation, { data, loading, error }] = useUpdatePurfenceScheduledTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      update: // value for 'update'
 *   },
 * });
 */
export function useUpdatePurfenceScheduledTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePurfenceScheduledTaskMutation, UpdatePurfenceScheduledTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePurfenceScheduledTaskMutation, UpdatePurfenceScheduledTaskMutationVariables>(UpdatePurfenceScheduledTaskDocument, options);
      }
export type UpdatePurfenceScheduledTaskMutationHookResult = ReturnType<typeof useUpdatePurfenceScheduledTaskMutation>;
export type UpdatePurfenceScheduledTaskMutationResult = Apollo.MutationResult<UpdatePurfenceScheduledTaskMutation>;
export type UpdatePurfenceScheduledTaskMutationOptions = Apollo.BaseMutationOptions<UpdatePurfenceScheduledTaskMutation, UpdatePurfenceScheduledTaskMutationVariables>;
export const DeletePurfenceScheduledTaskDocument = gql`
    mutation DeletePurfenceScheduledTask($id: ID!) {
  deletePurfenceScheduledTask(id: $id)
}
    `;
export type DeletePurfenceScheduledTaskMutationFn = Apollo.MutationFunction<DeletePurfenceScheduledTaskMutation, DeletePurfenceScheduledTaskMutationVariables>;

/**
 * __useDeletePurfenceScheduledTaskMutation__
 *
 * To run a mutation, you first call `useDeletePurfenceScheduledTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePurfenceScheduledTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePurfenceScheduledTaskMutation, { data, loading, error }] = useDeletePurfenceScheduledTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePurfenceScheduledTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeletePurfenceScheduledTaskMutation, DeletePurfenceScheduledTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeletePurfenceScheduledTaskMutation, DeletePurfenceScheduledTaskMutationVariables>(DeletePurfenceScheduledTaskDocument, options);
      }
export type DeletePurfenceScheduledTaskMutationHookResult = ReturnType<typeof useDeletePurfenceScheduledTaskMutation>;
export type DeletePurfenceScheduledTaskMutationResult = Apollo.MutationResult<DeletePurfenceScheduledTaskMutation>;
export type DeletePurfenceScheduledTaskMutationOptions = Apollo.BaseMutationOptions<DeletePurfenceScheduledTaskMutation, DeletePurfenceScheduledTaskMutationVariables>;
export const RunPurfenceScheduledTaskDocument = gql`
    mutation RunPurfenceScheduledTask($id: ID!) {
  runPurfenceScheduledTask(id: $id)
}
    `;
export type RunPurfenceScheduledTaskMutationFn = Apollo.MutationFunction<RunPurfenceScheduledTaskMutation, RunPurfenceScheduledTaskMutationVariables>;

/**
 * __useRunPurfenceScheduledTaskMutation__
 *
 * To run a mutation, you first call `useRunPurfenceScheduledTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRunPurfenceScheduledTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [runPurfenceScheduledTaskMutation, { data, loading, error }] = useRunPurfenceScheduledTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRunPurfenceScheduledTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RunPurfenceScheduledTaskMutation, RunPurfenceScheduledTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RunPurfenceScheduledTaskMutation, RunPurfenceScheduledTaskMutationVariables>(RunPurfenceScheduledTaskDocument, options);
      }
export type RunPurfenceScheduledTaskMutationHookResult = ReturnType<typeof useRunPurfenceScheduledTaskMutation>;
export type RunPurfenceScheduledTaskMutationResult = Apollo.MutationResult<RunPurfenceScheduledTaskMutation>;
export type RunPurfenceScheduledTaskMutationOptions = Apollo.BaseMutationOptions<RunPurfenceScheduledTaskMutation, RunPurfenceScheduledTaskMutationVariables>;