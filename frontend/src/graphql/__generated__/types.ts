export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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
  changeDescription: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  instructions: Maybe<Scalars['String']['output']>;
  modelConfig: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  skills: Maybe<Array<Scalars['String']['output']>>;
  tags: Maybe<Array<Scalars['String']['output']>>;
  tools: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AgentArtifact = {
  __typename?: 'AgentArtifact';
  content: Maybe<AgentArtifactContentDto>;
  conversationId: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  toolName: Scalars['String']['output'];
  type: Maybe<AgentArtifactType>;
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
  chunk: Maybe<Scalars['Boolean']['output']>;
  footer: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
};

export type AgentArtifactFileContentDto = AgentArtifactContentDto & {
  __typename?: 'AgentArtifactFileContentDto';
  chunk: Maybe<Scalars['Boolean']['output']>;
  fileType: AgentArtifactFileType;
  fileUrl: Scalars['URL']['output'];
  filename: Scalars['String']['output'];
  footer: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
};

/** Type of file artifact */
export type AgentArtifactFileType =
  | 'DOCX'
  | 'PDF'
  | 'XLSX';

export type AgentArtifactFilter = {
  and: InputMaybe<Array<AgentArtifactFilter>>;
  conversationId: InputMaybe<IdFilterComparison>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  or: InputMaybe<Array<AgentArtifactFilter>>;
  toolName: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type AgentArtifactImageContentDto = AgentArtifactContentDto & {
  __typename?: 'AgentArtifactImageContentDto';
  chunk: Maybe<Scalars['Boolean']['output']>;
  footer: Maybe<Scalars['Boolean']['output']>;
  type: AgentArtifactType;
  url: Scalars['URL']['output'];
};

export type AgentArtifactSort = {
  direction: SortDirection;
  field: AgentArtifactSortFields;
  nulls: InputMaybe<SortNulls>;
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

export type AgentConversationSession = {
  __typename?: 'AgentConversationSession';
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  title: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Maybe<Scalars['String']['output']>;
};

export type AgentConversationSessionConnection = {
  __typename?: 'AgentConversationSessionConnection';
  /** Array of nodes. */
  nodes: Array<AgentConversationSession>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AgentConversationSessionCreateInput = {
  title: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type AgentConversationSessionDeleteResponse = {
  __typename?: 'AgentConversationSessionDeleteResponse';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  title: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type AgentConversationSessionFilter = {
  and: InputMaybe<Array<AgentConversationSessionFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  or: InputMaybe<Array<AgentConversationSessionFilter>>;
  title: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
  userId: InputMaybe<StringFieldComparison>;
};

export type AgentConversationSessionSort = {
  direction: SortDirection;
  field: AgentConversationSessionSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type AgentConversationSessionSortFields =
  | 'createdAt'
  | 'id'
  | 'title'
  | 'updatedAt'
  | 'userId';

export type AgentConversationSessionUpdateInput = {
  title: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type AgentCreateInput = {
  changeDescription: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  instructions: InputMaybe<Scalars['String']['input']>;
  modelConfig: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  skills: InputMaybe<Array<Scalars['String']['input']>>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  tools: InputMaybe<Array<Scalars['String']['input']>>;
};

export type AgentDeleteResponse = {
  __typename?: 'AgentDeleteResponse';
  changeDescription: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  instructions: Maybe<Scalars['String']['output']>;
  modelConfig: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  skills: Maybe<Array<Scalars['String']['output']>>;
  tags: Maybe<Array<Scalars['String']['output']>>;
  tools: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type AgentFilter = {
  and: InputMaybe<Array<AgentFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<AgentFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type AgentHistory = {
  __typename?: 'AgentHistory';
  agentId: Scalars['String']['output'];
  changeDescription: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  instructions: Maybe<Scalars['String']['output']>;
  modelConfig: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  skills: Maybe<Array<Scalars['String']['output']>>;
  tags: Maybe<Array<Scalars['String']['output']>>;
  tools: Maybe<Array<Scalars['String']['output']>>;
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
  agentId: Maybe<Scalars['String']['output']>;
  changeDescription: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  instructions: Maybe<Scalars['String']['output']>;
  modelConfig: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  skills: Maybe<Array<Scalars['String']['output']>>;
  tags: Maybe<Array<Scalars['String']['output']>>;
  tools: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type AgentHistoryFilter = {
  agentId: InputMaybe<StringFieldComparison>;
  and: InputMaybe<Array<AgentHistoryFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  or: InputMaybe<Array<AgentHistoryFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
  version: InputMaybe<IntFieldComparison>;
};

export type AgentHistorySort = {
  direction: SortDirection;
  field: AgentHistorySortFields;
  nulls: InputMaybe<SortNulls>;
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
  nulls: InputMaybe<SortNulls>;
};

export type AgentSortFields =
  | 'createdAt'
  | 'id'
  | 'name'
  | 'updatedAt';

export type AgentUpdateInput = {
  changeDescription: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  instructions: InputMaybe<Scalars['String']['input']>;
  modelConfig: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  skills: InputMaybe<Array<Scalars['String']['input']>>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  tools: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Third-party app integration type */
export type AppConfigType =
  | 'SLACK';

export type AppConfigTypeFilterComparison = {
  eq: InputMaybe<AppConfigType>;
  gt: InputMaybe<AppConfigType>;
  gte: InputMaybe<AppConfigType>;
  iLike: InputMaybe<AppConfigType>;
  in: InputMaybe<Array<AppConfigType>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<AppConfigType>;
  lt: InputMaybe<AppConfigType>;
  lte: InputMaybe<AppConfigType>;
  neq: InputMaybe<AppConfigType>;
  notILike: InputMaybe<AppConfigType>;
  notIn: InputMaybe<Array<AppConfigType>>;
  notLike: InputMaybe<AppConfigType>;
};

export type BooleanFieldComparison = {
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateManyPurfenceIssuesInput = {
  /** Array of records to create */
  purfenceIssues: Array<PurfenceIssueCreateInput>;
};

export type CreateOneAgentConversationSessionInput = {
  /** The record to create */
  agentConversationSession: AgentConversationSessionCreateInput;
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
  between: InputMaybe<DateFieldComparisonBetween>;
  eq: InputMaybe<Scalars['DateTime']['input']>;
  gt: InputMaybe<Scalars['DateTime']['input']>;
  gte: InputMaybe<Scalars['DateTime']['input']>;
  in: InputMaybe<Array<Scalars['DateTime']['input']>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  lt: InputMaybe<Scalars['DateTime']['input']>;
  lte: InputMaybe<Scalars['DateTime']['input']>;
  neq: InputMaybe<Scalars['DateTime']['input']>;
  notBetween: InputMaybe<DateFieldComparisonBetween>;
  notIn: InputMaybe<Array<Scalars['DateTime']['input']>>;
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

export type DeleteOneAgentConversationSessionInput = {
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
  eq: InputMaybe<ExecutionStage>;
  gt: InputMaybe<ExecutionStage>;
  gte: InputMaybe<ExecutionStage>;
  iLike: InputMaybe<ExecutionStage>;
  in: InputMaybe<Array<ExecutionStage>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<ExecutionStage>;
  lt: InputMaybe<ExecutionStage>;
  lte: InputMaybe<ExecutionStage>;
  neq: InputMaybe<ExecutionStage>;
  notILike: InputMaybe<ExecutionStage>;
  notIn: InputMaybe<Array<ExecutionStage>>;
  notLike: InputMaybe<ExecutionStage>;
};

export type IdFilterComparison = {
  eq: InputMaybe<Scalars['ID']['input']>;
  gt: InputMaybe<Scalars['ID']['input']>;
  gte: InputMaybe<Scalars['ID']['input']>;
  iLike: InputMaybe<Scalars['ID']['input']>;
  in: InputMaybe<Array<Scalars['ID']['input']>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<Scalars['ID']['input']>;
  lt: InputMaybe<Scalars['ID']['input']>;
  lte: InputMaybe<Scalars['ID']['input']>;
  neq: InputMaybe<Scalars['ID']['input']>;
  notILike: InputMaybe<Scalars['ID']['input']>;
  notIn: InputMaybe<Array<Scalars['ID']['input']>>;
  notLike: InputMaybe<Scalars['ID']['input']>;
};

export type IntFieldComparison = {
  between: InputMaybe<IntFieldComparisonBetween>;
  eq: InputMaybe<Scalars['Int']['input']>;
  gt: InputMaybe<Scalars['Int']['input']>;
  gte: InputMaybe<Scalars['Int']['input']>;
  in: InputMaybe<Array<Scalars['Int']['input']>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  lt: InputMaybe<Scalars['Int']['input']>;
  lte: InputMaybe<Scalars['Int']['input']>;
  neq: InputMaybe<Scalars['Int']['input']>;
  notBetween: InputMaybe<IntFieldComparisonBetween>;
  notIn: InputMaybe<Array<Scalars['Int']['input']>>;
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
  baseUrl: Maybe<Scalars['String']['output']>;
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
  apiKey: InputMaybe<Scalars['String']['input']>;
  baseUrl: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  provider: ProviderType;
};

export type ModelProviderDeleteResponse = {
  __typename?: 'ModelProviderDeleteResponse';
  baseUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  provider: Maybe<ProviderType>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type ModelProviderFilter = {
  and: InputMaybe<Array<ModelProviderFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  isActive: InputMaybe<BooleanFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<ModelProviderFilter>>;
  provider: InputMaybe<ProviderTypeFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type ModelProviderSort = {
  direction: SortDirection;
  field: ModelProviderSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type ModelProviderSortFields =
  | 'createdAt'
  | 'id'
  | 'isActive'
  | 'name'
  | 'provider'
  | 'updatedAt';

export type ModelProviderUpdateInput = {
  apiKey: InputMaybe<Scalars['String']['input']>;
  baseUrl: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  provider: InputMaybe<ProviderType>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createManyPurfenceIssues: Array<PurfenceIssue>;
  createOneAgent: Agent;
  createOneAgentConversationSession: AgentConversationSession;
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
  deleteOneAgentConversationSession: AgentConversationSessionDeleteResponse;
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
  updateOneAgentConversationSession: AgentConversationSession;
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


export type MutationCreateOneAgentConversationSessionArgs = {
  input: CreateOneAgentConversationSessionInput;
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


export type MutationDeleteOneAgentConversationSessionArgs = {
  input: DeleteOneAgentConversationSessionInput;
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
  changeDescription: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpdateOneAgentConversationSessionArgs = {
  input: UpdateOneAgentConversationSessionInput;
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
  attempts: Scalars['Int']['input'];
  isPaused: Scalars['Boolean']['input'];
  maxConcurrency: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};

export type MyQueueDeleteResponse = {
  __typename?: 'MyQueueDeleteResponse';
  attempts: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  isPaused: Maybe<Scalars['Boolean']['output']>;
  maxConcurrency: Maybe<Scalars['Int']['output']>;
  name: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type MyQueueFilter = {
  and: InputMaybe<Array<MyQueueFilter>>;
  attempts: InputMaybe<IntFieldComparison>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  isPaused: InputMaybe<BooleanFieldComparison>;
  maxConcurrency: InputMaybe<IntFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<MyQueueFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type MyQueueJob = {
  __typename?: 'MyQueueJob';
  attempts: Scalars['Int']['output'];
  availableAt: Scalars['DateTime']['output'];
  completedAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['JSON']['output'];
  errorMessage: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  queueId: Scalars['String']['output'];
  queueName: Scalars['String']['output'];
  runCount: Scalars['Int']['output'];
  runningAt: Maybe<Scalars['DateTime']['output']>;
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
  attempts: Scalars['Int']['input'];
  availableAt: Scalars['DateTime']['input'];
  data: Scalars['JSON']['input'];
  queueId: Scalars['String']['input'];
  queueName: Scalars['String']['input'];
};

export type MyQueueJobDeleteResponse = {
  __typename?: 'MyQueueJobDeleteResponse';
  attempts: Maybe<Scalars['Int']['output']>;
  availableAt: Maybe<Scalars['DateTime']['output']>;
  completedAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  data: Maybe<Scalars['JSON']['output']>;
  errorMessage: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  queueId: Maybe<Scalars['String']['output']>;
  queueName: Maybe<Scalars['String']['output']>;
  runCount: Maybe<Scalars['Int']['output']>;
  runningAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<MyQueueJobStatus>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type MyQueueJobFilter = {
  and: InputMaybe<Array<MyQueueJobFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  or: InputMaybe<Array<MyQueueJobFilter>>;
  queueId: InputMaybe<StringFieldComparison>;
  queueName: InputMaybe<StringFieldComparison>;
  status: InputMaybe<MyQueueJobStatusFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type MyQueueJobSort = {
  direction: SortDirection;
  field: MyQueueJobSortFields;
  nulls: InputMaybe<SortNulls>;
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
  eq: InputMaybe<MyQueueJobStatus>;
  gt: InputMaybe<MyQueueJobStatus>;
  gte: InputMaybe<MyQueueJobStatus>;
  iLike: InputMaybe<MyQueueJobStatus>;
  in: InputMaybe<Array<MyQueueJobStatus>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<MyQueueJobStatus>;
  lt: InputMaybe<MyQueueJobStatus>;
  lte: InputMaybe<MyQueueJobStatus>;
  neq: InputMaybe<MyQueueJobStatus>;
  notILike: InputMaybe<MyQueueJobStatus>;
  notIn: InputMaybe<Array<MyQueueJobStatus>>;
  notLike: InputMaybe<MyQueueJobStatus>;
};

export type MyQueueJobUpdateInput = {
  attempts: InputMaybe<Scalars['Int']['input']>;
  availableAt: InputMaybe<Scalars['DateTime']['input']>;
  data: InputMaybe<Scalars['JSON']['input']>;
  queueId: InputMaybe<Scalars['String']['input']>;
  queueName: InputMaybe<Scalars['String']['input']>;
};

export type MyQueueSort = {
  direction: SortDirection;
  field: MyQueueSortFields;
  nulls: InputMaybe<SortNulls>;
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
  attempts: InputMaybe<Scalars['Int']['input']>;
  isPaused: InputMaybe<Scalars['Boolean']['input']>;
  maxConcurrency: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};

export type OffsetPageInfo = {
  __typename?: 'OffsetPageInfo';
  /** true if paging forward and there are more records. */
  hasNextPage: Maybe<Scalars['Boolean']['output']>;
  /** true if paging backwards and there are more records. */
  hasPreviousPage: Maybe<Scalars['Boolean']['output']>;
};

export type OffsetPaging = {
  /** Limit the number of records returned */
  limit: InputMaybe<Scalars['Int']['input']>;
  /** Offset to start returning records from */
  offset: InputMaybe<Scalars['Int']['input']>;
};

/** AI model provider type */
export type ProviderType =
  | 'ANTHROPIC'
  | 'OPENAI'
  | 'OPENAI_COMPATIBLE';

export type ProviderTypeFilterComparison = {
  eq: InputMaybe<ProviderType>;
  gt: InputMaybe<ProviderType>;
  gte: InputMaybe<ProviderType>;
  iLike: InputMaybe<ProviderType>;
  in: InputMaybe<Array<ProviderType>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<ProviderType>;
  lt: InputMaybe<ProviderType>;
  lte: InputMaybe<ProviderType>;
  neq: InputMaybe<ProviderType>;
  notILike: InputMaybe<ProviderType>;
  notIn: InputMaybe<Array<ProviderType>>;
  notLike: InputMaybe<ProviderType>;
};

export type PurfenceAppConfig = {
  __typename?: 'PurfenceAppConfig';
  config: Maybe<Scalars['JSON']['output']>;
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
  config: InputMaybe<Scalars['JSON']['input']>;
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  type: AppConfigType;
};

export type PurfenceAppConfigDeleteResponse = {
  __typename?: 'PurfenceAppConfigDeleteResponse';
  config: Maybe<Scalars['JSON']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  enabled: Maybe<Scalars['Boolean']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  name: Maybe<Scalars['String']['output']>;
  type: Maybe<AppConfigType>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type PurfenceAppConfigFilter = {
  and: InputMaybe<Array<PurfenceAppConfigFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceAppConfigFilter>>;
  type: InputMaybe<AppConfigTypeFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceAppConfigSort = {
  direction: SortDirection;
  field: PurfenceAppConfigSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type PurfenceAppConfigSortFields =
  | 'createdAt'
  | 'id'
  | 'name'
  | 'type'
  | 'updatedAt';

export type PurfenceAppConfigUpdateInput = {
  config: InputMaybe<Scalars['JSON']['input']>;
  enabled: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<AppConfigType>;
};

export type PurfenceConfig = {
  __typename?: 'PurfenceConfig';
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Maybe<Scalars['JSON']['output']>;
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
  value: InputMaybe<Scalars['JSON']['input']>;
};

export type PurfenceConfigDeleteResponse = {
  __typename?: 'PurfenceConfigDeleteResponse';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  key: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  value: Maybe<Scalars['JSON']['output']>;
};

export type PurfenceConfigFilter = {
  and: InputMaybe<Array<PurfenceConfigFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  or: InputMaybe<Array<PurfenceConfigFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceConfigSort = {
  direction: SortDirection;
  field: PurfenceConfigSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type PurfenceConfigSortFields =
  | 'createdAt'
  | 'id'
  | 'updatedAt';

export type PurfenceConfigUpdateInput = {
  key: InputMaybe<Scalars['String']['input']>;
  value: InputMaybe<Scalars['JSON']['input']>;
};

export type PurfenceExecution = {
  __typename?: 'PurfenceExecution';
  branchName: Maybe<Scalars['String']['output']>;
  conversationId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  error: Maybe<Scalars['String']['output']>;
  executionDir: Maybe<Scalars['String']['output']>;
  goal: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  issueId: Scalars['String']['output'];
  jobQueryUrl: Maybe<Scalars['String']['output']>;
  parentExecutionId: Maybe<Scalars['String']['output']>;
  projectId: Scalars['String']['output'];
  stage: ExecutionStage;
  status: PurfenceStatus;
  updatedAt: Scalars['DateTime']['output'];
  worktreePath: Maybe<Scalars['String']['output']>;
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
  and: InputMaybe<Array<PurfenceExecutionDeleteFilter>>;
  conversationId: InputMaybe<StringFieldComparison>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  issueId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceExecutionDeleteFilter>>;
  projectId: InputMaybe<StringFieldComparison>;
  stage: InputMaybe<ExecutionStageFilterComparison>;
  status: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionDeleteResponse = {
  __typename?: 'PurfenceExecutionDeleteResponse';
  branchName: Maybe<Scalars['String']['output']>;
  conversationId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  error: Maybe<Scalars['String']['output']>;
  executionDir: Maybe<Scalars['String']['output']>;
  goal: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  issueId: Maybe<Scalars['String']['output']>;
  jobQueryUrl: Maybe<Scalars['String']['output']>;
  parentExecutionId: Maybe<Scalars['String']['output']>;
  projectId: Maybe<Scalars['String']['output']>;
  stage: Maybe<ExecutionStage>;
  status: Maybe<PurfenceStatus>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  worktreePath: Maybe<Scalars['String']['output']>;
};

export type PurfenceExecutionFilter = {
  and: InputMaybe<Array<PurfenceExecutionFilter>>;
  conversationId: InputMaybe<StringFieldComparison>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  issueId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceExecutionFilter>>;
  projectId: InputMaybe<StringFieldComparison>;
  stage: InputMaybe<ExecutionStageFilterComparison>;
  status: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionSort = {
  direction: SortDirection;
  field: PurfenceExecutionSortFields;
  nulls: InputMaybe<SortNulls>;
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
  and: InputMaybe<Array<PurfenceExecutionUpdateFilter>>;
  conversationId: InputMaybe<StringFieldComparison>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  issueId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceExecutionUpdateFilter>>;
  projectId: InputMaybe<StringFieldComparison>;
  stage: InputMaybe<ExecutionStageFilterComparison>;
  status: InputMaybe<PurfenceStatusFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceExecutionUpdateInput = {
  error: InputMaybe<Scalars['String']['input']>;
  goal: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<PurfenceStatus>;
};

export type PurfenceIssue = {
  __typename?: 'PurfenceIssue';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  latestExecutionId: Maybe<Scalars['String']['output']>;
  projectId: Scalars['String']['output'];
  status: PurfenceStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workdir: Maybe<Scalars['String']['output']>;
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
  dependsOnIssueId: InputMaybe<Scalars['ID']['input']>;
  description: Scalars['String']['input'];
  origin: InputMaybe<IssueOrigin>;
  projectId: Scalars['ID']['input'];
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type PurfenceIssueFilter = {
  and: InputMaybe<Array<PurfenceIssueFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  latestExecutionId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceIssueFilter>>;
  projectId: InputMaybe<StringFieldComparison>;
  status: InputMaybe<PurfenceStatusFilterComparison>;
  title: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceIssueSort = {
  direction: SortDirection;
  field: PurfenceIssueSortFields;
  nulls: InputMaybe<SortNulls>;
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
  and: InputMaybe<Array<PurfenceIssueUpdateFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  latestExecutionId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceIssueUpdateFilter>>;
  projectId: InputMaybe<StringFieldComparison>;
  status: InputMaybe<PurfenceStatusFilterComparison>;
  title: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceIssueUpdateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<PurfenceStatus>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceProject = {
  __typename?: 'PurfenceProject';
  createdAt: Scalars['DateTime']['output'];
  defaultBranch: Scalars['String']['output'];
  description: Maybe<Scalars['String']['output']>;
  externalPath: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  localRootPath: Scalars['String']['output'];
  name: Maybe<Scalars['String']['output']>;
  slackAppConfigId: Maybe<Scalars['String']['output']>;
  slackChannelId: Maybe<Scalars['String']['output']>;
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
  defaultBranch: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  externalPath: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};

export type PurfenceProjectDeleteFilter = {
  and: InputMaybe<Array<PurfenceProjectDeleteFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  defaultBranch: InputMaybe<StringFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  localRootPath: InputMaybe<StringFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceProjectDeleteFilter>>;
  slackAppConfigId: InputMaybe<StringFieldComparison>;
  slackChannelId: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectDeleteResponse = {
  __typename?: 'PurfenceProjectDeleteResponse';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  defaultBranch: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  externalPath: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  localRootPath: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slackAppConfigId: Maybe<Scalars['String']['output']>;
  slackChannelId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type PurfenceProjectFilter = {
  and: InputMaybe<Array<PurfenceProjectFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  defaultBranch: InputMaybe<StringFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  localRootPath: InputMaybe<StringFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceProjectFilter>>;
  slackAppConfigId: InputMaybe<StringFieldComparison>;
  slackChannelId: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectSort = {
  direction: SortDirection;
  field: PurfenceProjectSortFields;
  nulls: InputMaybe<SortNulls>;
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
  and: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  defaultBranch: InputMaybe<StringFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  localRootPath: InputMaybe<StringFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  slackAppConfigId: InputMaybe<StringFieldComparison>;
  slackChannelId: InputMaybe<StringFieldComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectUpdateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId: InputMaybe<Scalars['String']['input']>;
  slackChannelId: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceScheduledTask = {
  __typename?: 'PurfenceScheduledTask';
  createdAt: Scalars['DateTime']['output'];
  cronExpr: Maybe<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  kind: PurfenceScheduledTaskKind;
  lastError: Maybe<Scalars['String']['output']>;
  lastRunAt: Maybe<Scalars['DateTime']['output']>;
  lastStatus: Maybe<PurfenceScheduledTaskLastStatus>;
  name: Scalars['String']['output'];
  nextRunAt: Maybe<Scalars['DateTime']['output']>;
  prompt: Scalars['String']['output'];
  runAt: Maybe<Scalars['DateTime']['output']>;
  runCount: Scalars['Int']['output'];
  slackAppConfigId: Maybe<Scalars['String']['output']>;
  slackChannelId: Maybe<Scalars['String']['output']>;
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
  cronExpr: InputMaybe<Scalars['String']['input']>;
  enabled: InputMaybe<Scalars['Boolean']['input']>;
  kind: PurfenceScheduledTaskKind;
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  runAt: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId: InputMaybe<Scalars['String']['input']>;
  slackChannelId: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceScheduledTaskFilter = {
  and: InputMaybe<Array<PurfenceScheduledTaskFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  enabled: InputMaybe<BooleanFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  kind: InputMaybe<PurfenceScheduledTaskKindFilterComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceScheduledTaskFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceScheduledTaskKind =
  | 'one_time'
  | 'recurring';

export type PurfenceScheduledTaskKindFilterComparison = {
  eq: InputMaybe<PurfenceScheduledTaskKind>;
  gt: InputMaybe<PurfenceScheduledTaskKind>;
  gte: InputMaybe<PurfenceScheduledTaskKind>;
  iLike: InputMaybe<PurfenceScheduledTaskKind>;
  in: InputMaybe<Array<PurfenceScheduledTaskKind>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<PurfenceScheduledTaskKind>;
  lt: InputMaybe<PurfenceScheduledTaskKind>;
  lte: InputMaybe<PurfenceScheduledTaskKind>;
  neq: InputMaybe<PurfenceScheduledTaskKind>;
  notILike: InputMaybe<PurfenceScheduledTaskKind>;
  notIn: InputMaybe<Array<PurfenceScheduledTaskKind>>;
  notLike: InputMaybe<PurfenceScheduledTaskKind>;
};

export type PurfenceScheduledTaskLastStatus =
  | 'failed'
  | 'success';

export type PurfenceScheduledTaskSort = {
  direction: SortDirection;
  field: PurfenceScheduledTaskSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type PurfenceScheduledTaskSortFields =
  | 'createdAt'
  | 'enabled'
  | 'id'
  | 'kind'
  | 'name'
  | 'updatedAt';

export type PurfenceScheduledTaskUpdateInput = {
  cronExpr: InputMaybe<Scalars['String']['input']>;
  enabled: InputMaybe<Scalars['Boolean']['input']>;
  kind: InputMaybe<PurfenceScheduledTaskKind>;
  name: InputMaybe<Scalars['String']['input']>;
  prompt: InputMaybe<Scalars['String']['input']>;
  runAt: InputMaybe<Scalars['String']['input']>;
  slackAppConfigId: InputMaybe<Scalars['String']['input']>;
  slackChannelId: InputMaybe<Scalars['String']['input']>;
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
  eq: InputMaybe<PurfenceStatus>;
  gt: InputMaybe<PurfenceStatus>;
  gte: InputMaybe<PurfenceStatus>;
  iLike: InputMaybe<PurfenceStatus>;
  in: InputMaybe<Array<PurfenceStatus>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<PurfenceStatus>;
  lt: InputMaybe<PurfenceStatus>;
  lte: InputMaybe<PurfenceStatus>;
  neq: InputMaybe<PurfenceStatus>;
  notILike: InputMaybe<PurfenceStatus>;
  notIn: InputMaybe<Array<PurfenceStatus>>;
  notLike: InputMaybe<PurfenceStatus>;
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  agent: Agent;
  agentArtifact: AgentArtifact;
  agentArtifacts: AgentArtifactConnection;
  agentConversationSession: AgentConversationSession;
  agentConversationSessions: AgentConversationSessionConnection;
  agentHistories: AgentHistoryConnection;
  agentHistory: AgentHistory;
  agents: AgentConnection;
  /** ping test */
  hello: Maybe<Scalars['JSON']['output']>;
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


export type QueryAgentConversationSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentConversationSessionsArgs = {
  filter?: AgentConversationSessionFilter;
  paging?: OffsetPaging;
  sorting?: Array<AgentConversationSessionSort>;
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
  eq: InputMaybe<Scalars['String']['input']>;
  gt: InputMaybe<Scalars['String']['input']>;
  gte: InputMaybe<Scalars['String']['input']>;
  iLike: InputMaybe<Scalars['String']['input']>;
  in: InputMaybe<Array<Scalars['String']['input']>>;
  is: InputMaybe<Scalars['Boolean']['input']>;
  isNot: InputMaybe<Scalars['Boolean']['input']>;
  like: InputMaybe<Scalars['String']['input']>;
  lt: InputMaybe<Scalars['String']['input']>;
  lte: InputMaybe<Scalars['String']['input']>;
  neq: InputMaybe<Scalars['String']['input']>;
  notILike: InputMaybe<Scalars['String']['input']>;
  notIn: InputMaybe<Array<Scalars['String']['input']>>;
  notLike: InputMaybe<Scalars['String']['input']>;
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

export type UpdateOneAgentConversationSessionInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: AgentConversationSessionUpdateInput;
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
  sdl: Maybe<Scalars['String']['output']>;
};

export type Link__Purpose =
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  | 'EXECUTION'
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  | 'SECURITY';

export type GetAgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentsQuery = { __typename?: 'Query', agents: { __typename?: 'AgentConnection', totalCount: number, nodes: Array<{ __typename?: 'Agent', id: string, name: string, instructions: string | null, description: string | null, changeDescription: string | null, tags: Array<string> | null, tools: Array<string> | null, skills: Array<string> | null, modelConfig: any | null, createdAt: any, updatedAt: any }> } };

export type GetAgentHistoriesQueryVariables = Exact<{
  agentId: Scalars['String']['input'];
}>;


export type GetAgentHistoriesQuery = { __typename?: 'Query', agentHistories: { __typename?: 'AgentHistoryConnection', totalCount: number, nodes: Array<{ __typename?: 'AgentHistory', id: string, agentId: string, version: number, name: string, instructions: string | null, description: string | null, changeDescription: string | null, tags: Array<string> | null, tools: Array<string> | null, skills: Array<string> | null, modelConfig: any | null, createdAt: any, updatedAt: any }> } };

export type AgentConversationSessionsQueryVariables = Exact<{
  filter: InputMaybe<AgentConversationSessionFilter>;
  paging: InputMaybe<OffsetPaging>;
  sorting: InputMaybe<Array<AgentConversationSessionSort> | AgentConversationSessionSort>;
}>;


export type AgentConversationSessionsQuery = { __typename?: 'Query', agentConversationSessions: { __typename?: 'AgentConversationSessionConnection', totalCount: number, nodes: Array<{ __typename?: 'AgentConversationSession', id: string, userId: string | null, title: string | null, createdAt: any, updatedAt: any }> } };

export type CreateOneAgentConversationSessionMutationVariables = Exact<{
  input: AgentConversationSessionCreateInput;
}>;


export type CreateOneAgentConversationSessionMutation = { __typename?: 'Mutation', createOneAgentConversationSession: { __typename?: 'AgentConversationSession', id: string, userId: string | null, title: string | null, createdAt: any, updatedAt: any } };

export type DeleteOneAgentConversationSessionMutationVariables = Exact<{
  input: DeleteOneAgentConversationSessionInput;
}>;


export type DeleteOneAgentConversationSessionMutation = { __typename?: 'Mutation', deleteOneAgentConversationSession: { __typename?: 'AgentConversationSessionDeleteResponse', id: string | null } };

export type CreateAgentMutationVariables = Exact<{
  input: AgentCreateInput;
}>;


export type CreateAgentMutation = { __typename?: 'Mutation', createOneAgent: { __typename?: 'Agent', id: string, name: string, instructions: string | null, description: string | null, changeDescription: string | null, tags: Array<string> | null, tools: Array<string> | null, skills: Array<string> | null, modelConfig: any | null, createdAt: any, updatedAt: any } };

export type UpdateAgentMutationVariables = Exact<{
  input: UpdateOneAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateOneAgent: { __typename?: 'Agent', id: string, name: string, instructions: string | null, description: string | null, changeDescription: string | null, tags: Array<string> | null, tools: Array<string> | null, skills: Array<string> | null, modelConfig: any | null, createdAt: any, updatedAt: any } };

export type RollbackAgentHistoryMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  historyId: Scalars['ID']['input'];
  changeDescription: InputMaybe<Scalars['String']['input']>;
}>;


export type RollbackAgentHistoryMutation = { __typename?: 'Mutation', rollbackAgentHistory: { __typename?: 'Agent', id: string, name: string, instructions: string | null, description: string | null, tags: Array<string> | null, tools: Array<string> | null, skills: Array<string> | null, modelConfig: any | null, createdAt: any, updatedAt: any } };

export type DeleteAgentHistoryMutationVariables = Exact<{
  input: DeleteOneAgentHistoryInput;
}>;


export type DeleteAgentHistoryMutation = { __typename?: 'Mutation', deleteOneAgentHistory: { __typename?: 'AgentHistoryDeleteResponse', id: string | null } };

export type DeleteAgentMutationVariables = Exact<{
  input: DeleteOneAgentInput;
}>;


export type DeleteAgentMutation = { __typename?: 'Mutation', deleteOneAgent: { __typename?: 'AgentDeleteResponse', id: string | null } };

export type GetAppConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAppConfigsQuery = { __typename?: 'Query', purfenceAppConfigs: { __typename?: 'PurfenceAppConfigConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config: any | null, createdAt: any, updatedAt: any }> } };

export type CreateAppConfigMutationVariables = Exact<{
  input: CreateOnePurfenceAppConfigInput;
}>;


export type CreateAppConfigMutation = { __typename?: 'Mutation', createOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config: any | null, createdAt: any, updatedAt: any } };

export type UpdateAppConfigMutationVariables = Exact<{
  input: UpdateOnePurfenceAppConfigInput;
}>;


export type UpdateAppConfigMutation = { __typename?: 'Mutation', updateOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfig', id: string, name: string, type: AppConfigType, enabled: boolean, config: any | null, createdAt: any, updatedAt: any } };

export type DeleteAppConfigMutationVariables = Exact<{
  input: DeleteOnePurfenceAppConfigInput;
}>;


export type DeleteAppConfigMutation = { __typename?: 'Mutation', deleteOnePurfenceAppConfig: { __typename?: 'PurfenceAppConfigDeleteResponse', id: string | null } };

export type GetProviderConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProviderConfigsQuery = { __typename?: 'Query', modelProviders: { __typename?: 'ModelProviderConnection', totalCount: number, nodes: Array<{ __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl: string | null, isActive: boolean, createdAt: any, updatedAt: any }> } };

export type GetProviderConfigQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProviderConfigQuery = { __typename?: 'Query', modelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl: string | null, isActive: boolean, createdAt: any, updatedAt: any } };

export type CreateProviderConfigMutationVariables = Exact<{
  input: CreateOneModelProviderInput;
}>;


export type CreateProviderConfigMutation = { __typename?: 'Mutation', createOneModelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl: string | null, isActive: boolean, createdAt: any } };

export type UpdateProviderConfigMutationVariables = Exact<{
  input: UpdateOneModelProviderInput;
}>;


export type UpdateProviderConfigMutation = { __typename?: 'Mutation', updateOneModelProvider: { __typename?: 'ModelProvider', id: string, provider: ProviderType, name: string, baseUrl: string | null, isActive: boolean, updatedAt: any } };

export type DeleteProviderConfigMutationVariables = Exact<{
  input: DeleteOneModelProviderInput;
}>;


export type DeleteProviderConfigMutation = { __typename?: 'Mutation', deleteOneModelProvider: { __typename?: 'ModelProviderDeleteResponse', id: string | null } };

export type GetAllPurfenceConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllPurfenceConfigsQuery = { __typename?: 'Query', purfenceConfigs: { __typename?: 'PurfenceConfigConnection', nodes: Array<{ __typename?: 'PurfenceConfig', id: string, key: string, value: any | null, createdAt: any, updatedAt: any }> } };

export type CreatePurfenceConfigMutationVariables = Exact<{
  input: CreateOnePurfenceConfigInput;
}>;


export type CreatePurfenceConfigMutation = { __typename?: 'Mutation', createOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, key: string, value: any | null, createdAt: any, updatedAt: any } };

export type UpdatePurfenceConfigMutationVariables = Exact<{
  input: UpdateOnePurfenceConfigInput;
}>;


export type UpdatePurfenceConfigMutation = { __typename?: 'Mutation', updateOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, key: string, value: any | null, createdAt: any, updatedAt: any } };

export type CreateOnePurfenceProjectMutationVariables = Exact<{
  input: CreateOnePurfenceProjectInput;
}>;


export type CreateOnePurfenceProjectMutation = { __typename?: 'Mutation', createOnePurfenceProject: { __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, externalPath: string | null, defaultBranch: string, slackAppConfigId: string | null, slackChannelId: string | null, createdAt: any, updatedAt: any } };

export type UpdateOnePurfenceProjectMutationVariables = Exact<{
  input: UpdateOnePurfenceProjectInput;
}>;


export type UpdateOnePurfenceProjectMutation = { __typename?: 'Mutation', updateOnePurfenceProject: { __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, slackAppConfigId: string | null, slackChannelId: string | null, updatedAt: any } };

export type CreateOnePurfenceIssueMutationVariables = Exact<{
  input: CreateOnePurfenceIssueInput;
}>;


export type CreateOnePurfenceIssueMutation = { __typename?: 'Mutation', createOnePurfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId: string | null, createdAt: any, updatedAt: any, workdir: string | null } };

export type PurfenceProjectsQueryVariables = Exact<{
  paging: InputMaybe<OffsetPaging>;
  filter: InputMaybe<PurfenceProjectFilter>;
  sorting: InputMaybe<Array<PurfenceProjectSort> | PurfenceProjectSort>;
}>;


export type PurfenceProjectsQuery = { __typename?: 'Query', purfenceProjects: { __typename?: 'PurfenceProjectConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, slackAppConfigId: string | null, slackChannelId: string | null, createdAt: any, updatedAt: any }> } };

export type PurfenceIssueQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceIssueQuery = { __typename?: 'Query', purfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId: string | null, workdir: string | null, createdAt: any, updatedAt: any } };

export type PurfenceProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceProjectQuery = { __typename?: 'Query', purfenceProject: { __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, slackAppConfigId: string | null, slackChannelId: string | null, createdAt: any, updatedAt: any } };

export type PurfenceIssuesQueryVariables = Exact<{
  paging: InputMaybe<OffsetPaging>;
  filter: InputMaybe<PurfenceIssueFilter>;
  sorting: InputMaybe<Array<PurfenceIssueSort> | PurfenceIssueSort>;
}>;


export type PurfenceIssuesQuery = { __typename?: 'Query', purfenceIssues: { __typename?: 'PurfenceIssueConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId: string | null, createdAt: any, updatedAt: any }> } };

export type PurfenceExecutionsQueryVariables = Exact<{
  paging: InputMaybe<OffsetPaging>;
  filter: InputMaybe<PurfenceExecutionFilter>;
  sorting: InputMaybe<Array<PurfenceExecutionSort> | PurfenceExecutionSort>;
}>;


export type PurfenceExecutionsQuery = { __typename?: 'Query', purfenceExecutions: { __typename?: 'PurfenceExecutionConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceExecution', id: string, projectId: string, issueId: string, goal: string | null, status: PurfenceStatus, branchName: string | null, worktreePath: string | null, executionDir: string | null, error: string | null, createdAt: any, updatedAt: any }> } };

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


export type MyQueueJobsQuery = { __typename?: 'Query', myQueueJobs: { __typename?: 'MyQueueJobConnection', totalCount: number, nodes: Array<{ __typename?: 'MyQueueJob', id: string, queueId: string, queueName: string, data: any, status: MyQueueJobStatus, availableAt: any, attempts: number, runCount: number, errorMessage: string | null, createdAt: any, updatedAt: any, runningAt: any | null, completedAt: any | null }> } };

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


export type CreateMyQueueJobMutation = { __typename?: 'Mutation', createOneMyQueueJob: { __typename?: 'MyQueueJob', id: string, queueId: string, queueName: string, status: MyQueueJobStatus, availableAt: any, attempts: number, runCount: number, errorMessage: string | null, createdAt: any } };

export type DeleteMyQueueJobMutationVariables = Exact<{
  input: DeleteOneMyQueueJobInput;
}>;


export type DeleteMyQueueJobMutation = { __typename?: 'Mutation', deleteOneMyQueueJob: { __typename?: 'MyQueueJobDeleteResponse', id: string | null } };

export type PurfenceScheduledTasksQueryVariables = Exact<{
  paging: InputMaybe<OffsetPaging>;
  sorting: InputMaybe<Array<PurfenceScheduledTaskSort> | PurfenceScheduledTaskSort>;
}>;


export type PurfenceScheduledTasksQuery = { __typename?: 'Query', purfenceScheduledTasks: { __typename?: 'PurfenceScheduledTaskConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceScheduledTask', id: string, name: string, prompt: string, kind: PurfenceScheduledTaskKind, cronExpr: string | null, runAt: any | null, enabled: boolean, nextRunAt: any | null, lastRunAt: any | null, lastStatus: PurfenceScheduledTaskLastStatus | null, lastError: string | null, runCount: number, slackAppConfigId: string | null, slackChannelId: string | null, createdAt: any, updatedAt: any }> } };

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
