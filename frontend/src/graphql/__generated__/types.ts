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
  _Any: { input: any; output: any; }
  federation__FieldSet: { input: any; output: any; }
  link__Import: { input: any; output: any; }
};

export type ClaudeCodeConfig = {
  __typename?: 'ClaudeCodeConfig';
  createdAt: Scalars['DateTime']['output'];
  env: Maybe<Array<ClaudeCodeEnvItem>>;
  /** ID */
  id: Scalars['ID']['output'];
  modelProviderId: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  useDefaultConfig: Scalars['Boolean']['output'];
};

export type ClaudeCodeConfigConnection = {
  __typename?: 'ClaudeCodeConfigConnection';
  /** Array of nodes. */
  nodes: Array<ClaudeCodeConfig>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type ClaudeCodeConfigCreateInput = {
  env: InputMaybe<Array<ClaudeCodeEnvItemInput>>;
  modelProviderId: InputMaybe<Scalars['String']['input']>;
  useDefaultConfig: Scalars['Boolean']['input'];
};

export type ClaudeCodeConfigDeleteResponse = {
  __typename?: 'ClaudeCodeConfigDeleteResponse';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  env: Maybe<Array<ClaudeCodeEnvItem>>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  modelProviderId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  useDefaultConfig: Maybe<Scalars['Boolean']['output']>;
};

export type ClaudeCodeConfigFilter = {
  and: InputMaybe<Array<ClaudeCodeConfigFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  modelProviderId: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<ClaudeCodeConfigFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type ClaudeCodeConfigSort = {
  direction: SortDirection;
  field: ClaudeCodeConfigSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type ClaudeCodeConfigSortFields =
  | 'createdAt'
  | 'id'
  | 'modelProviderId'
  | 'updatedAt';

export type ClaudeCodeConfigUpdateInput = {
  env: InputMaybe<Array<ClaudeCodeEnvItemInput>>;
  modelProviderId: InputMaybe<Scalars['String']['input']>;
  useDefaultConfig: InputMaybe<Scalars['Boolean']['input']>;
};

export type ClaudeCodeEnvItem = {
  __typename?: 'ClaudeCodeEnvItem';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ClaudeCodeEnvItemInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CodexOAuthInfoObject = {
  __typename?: 'CodexOAuthInfoObject';
  accessToken: Scalars['String']['output'];
  accountId: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['Int']['output'];
  idToken: Maybe<Scalars['String']['output']>;
  refreshToken: Scalars['String']['output'];
  scope: Maybe<Scalars['String']['output']>;
  tokenType: Scalars['String']['output'];
};

export type CreateManyPurfenceIssuesInput = {
  /** Array of records to create */
  purfenceIssues: Array<PurfenceIssueCreateInput>;
};

export type CreateOneClaudeCodeConfigInput = {
  /** The record to create */
  claudeCodeConfig: ClaudeCodeConfigCreateInput;
};

export type CreateOnePurfenceIssueInput = {
  /** The record to create */
  purfenceIssue: PurfenceIssueCreateInput;
};

export type CreateOnePurfenceProjectInput = {
  /** The record to create */
  purfenceProject: PurfenceProjectCreateInput;
};

export type CreateOneModelProviderConfigDtoInput = {
  /** The record to create */
  modelProviderConfigDto: ModelProviderConfigCreateInput;
};

export type CreateOnePurfenceConfigInput = {
  /** The record to create */
  purfenceConfig: PurfenceConfigCreateInput;
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

export type DeleteOneClaudeCodeConfigInput = {
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

export type DeleteOneModelProviderConfigDtoInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOnePurfenceConfigInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
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
  | 'updatedAt';

export type PurfenceProjectUpdateFilter = {
  and: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  defaultBranch: InputMaybe<StringFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  localRootPath: InputMaybe<StringFieldComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<PurfenceProjectUpdateFilter>>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type PurfenceProjectUpdateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
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

export type ModelProviderConfigCreateInput = {
  apiKey: InputMaybe<Scalars['String']['input']>;
  baseUrl: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  isDefault: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  provider: ProviderType;
  refreshToken: InputMaybe<Scalars['String']['input']>;
};

/**
 * ModelProviderConfig DTO
 *
 * GraphQL output type for ModelProviderConfig.
 * Excludes sensitive data (apiKey, refreshToken) for security.
 */
export type ModelProviderConfigDto = {
  __typename?: 'ModelProviderConfigDto';
  baseUrl: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  provider: ProviderType;
  updatedAt: Scalars['DateTime']['output'];
};

export type ModelProviderConfigDtoConnection = {
  __typename?: 'ModelProviderConfigDtoConnection';
  /** Array of nodes. */
  nodes: Array<ModelProviderConfigDto>;
  /** Paging information */
  pageInfo: OffsetPageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type ModelProviderConfigDtoDeleteResponse = {
  __typename?: 'ModelProviderConfigDtoDeleteResponse';
  baseUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  deletedAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  isDefault: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  provider: Maybe<ProviderType>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type ModelProviderConfigDtoFilter = {
  and: InputMaybe<Array<ModelProviderConfigDtoFilter>>;
  createdAt: InputMaybe<DateFieldComparison>;
  id: InputMaybe<IdFilterComparison>;
  name: InputMaybe<StringFieldComparison>;
  or: InputMaybe<Array<ModelProviderConfigDtoFilter>>;
  provider: InputMaybe<ProviderTypeFilterComparison>;
  updatedAt: InputMaybe<DateFieldComparison>;
};

export type ModelProviderConfigDtoSort = {
  direction: SortDirection;
  field: ModelProviderConfigDtoSortFields;
  nulls: InputMaybe<SortNulls>;
};

export type ModelProviderConfigDtoSortFields =
  | 'createdAt'
  | 'id'
  | 'name'
  | 'provider'
  | 'updatedAt';

export type ModelProviderConfigUpdateInput = {
  apiKey: InputMaybe<Scalars['String']['input']>;
  baseUrl: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  provider: InputMaybe<ProviderType>;
  refreshToken: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createManyPurfenceIssues: Array<PurfenceIssue>;
  createOneClaudeCodeConfig: ClaudeCodeConfig;
  createOnePurfenceIssue: PurfenceIssue;
  createOnePurfenceProject: PurfenceProject;
  createOneModelProviderConfigDto: ModelProviderConfigDto;
  createOnePurfenceConfig: PurfenceConfig;
  deleteManyPurfenceExecutions: DeleteManyResponse;
  deleteManyPurfenceProjects: DeleteManyResponse;
  deleteOneClaudeCodeConfig: ClaudeCodeConfigDeleteResponse;
  deleteOnePurfenceExecution: PurfenceExecutionDeleteResponse;
  deleteOnePurfenceIssue: Scalars['ID']['output'];
  deleteOnePurfenceProject: PurfenceProjectDeleteResponse;
  deleteOneModelProviderConfigDto: ModelProviderConfigDtoDeleteResponse;
  deleteOnePurfenceConfig: PurfenceConfigDeleteResponse;
  handleCodexOAuthCallback: OAuthCallbackResponse;
  initiateCodexOAuth: OAuthAuthorization;
  refreshCodexToken: ModelProviderConfigDto;
  toggleModelProviderConfig: ModelProviderConfigDto;
  updateManyPurfenceExecutions: UpdateManyResponse;
  updateManyPurfenceIssues: UpdateManyResponse;
  updateManyPurfenceProjects: UpdateManyResponse;
  updateOneClaudeCodeConfig: ClaudeCodeConfig;
  updateOnePurfenceExecution: PurfenceExecution;
  updateOnePurfenceIssue: PurfenceIssue;
  updateOnePurfenceProject: PurfenceProject;
  updateOneModelProviderConfigDto: ModelProviderConfigDto;
  updateOnePurfenceConfig: PurfenceConfig;
};


export type MutationCreateManyPurfenceIssuesArgs = {
  input: CreateManyPurfenceIssuesInput;
};


export type MutationCreateOneClaudeCodeConfigArgs = {
  input: CreateOneClaudeCodeConfigInput;
};


export type MutationCreateOnePurfenceIssueArgs = {
  input: CreateOnePurfenceIssueInput;
};


export type MutationCreateOnePurfenceProjectArgs = {
  input: CreateOnePurfenceProjectInput;
};


export type MutationCreateOneModelProviderConfigDtoArgs = {
  input: CreateOneModelProviderConfigDtoInput;
};


export type MutationCreateOnePurfenceConfigArgs = {
  input: CreateOnePurfenceConfigInput;
};


export type MutationDeleteManyPurfenceExecutionsArgs = {
  input: DeleteManyPurfenceExecutionsInput;
};


export type MutationDeleteManyPurfenceProjectsArgs = {
  input: DeleteManyPurfenceProjectsInput;
};


export type MutationDeleteOneClaudeCodeConfigArgs = {
  input: DeleteOneClaudeCodeConfigInput;
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


export type MutationDeleteOneModelProviderConfigDtoArgs = {
  input: DeleteOneModelProviderConfigDtoInput;
};


export type MutationDeleteOnePurfenceConfigArgs = {
  input: DeleteOnePurfenceConfigInput;
};


export type MutationHandleCodexOAuthCallbackArgs = {
  code: Scalars['String']['input'];
  redirectUri: Scalars['String']['input'];
  state: Scalars['String']['input'];
};


export type MutationInitiateCodexOAuthArgs = {
  redirectUri: Scalars['String']['input'];
};


export type MutationRefreshCodexTokenArgs = {
  configId: Scalars['ID']['input'];
};


export type MutationToggleModelProviderConfigArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
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


export type MutationUpdateOneClaudeCodeConfigArgs = {
  input: UpdateOneClaudeCodeConfigInput;
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


export type MutationUpdateOneModelProviderConfigDtoArgs = {
  input: UpdateOneModelProviderConfigDtoInput;
};


export type MutationUpdateOnePurfenceConfigArgs = {
  input: UpdateOnePurfenceConfigInput;
};

export type OAuthAuthorization = {
  __typename?: 'OAuthAuthorization';
  authorizationUrl: Scalars['String']['output'];
  state: Scalars['String']['output'];
};

export type OAuthCallbackResponse = {
  __typename?: 'OAuthCallbackResponse';
  email: Scalars['String']['output'];
  oauthInfo: CodexOAuthInfoObject;
  quota: QuotaInfo;
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
  | 'CODEX'
  | 'KIMI'
  | 'OPENAI'
  | 'ZHIPU';

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

export type PurfenceConfig = {
  __typename?: 'PurfenceConfig';
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['ID']['output'];
  proxyUrl: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
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
  proxyUrl: InputMaybe<Scalars['String']['input']>;
};

export type PurfenceConfigDeleteResponse = {
  __typename?: 'PurfenceConfigDeleteResponse';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** ID */
  id: Maybe<Scalars['ID']['output']>;
  proxyUrl: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
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
  proxyUrl: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  claudeCodeConfig: ClaudeCodeConfig;
  claudeCodeConfigs: ClaudeCodeConfigConnection;
  purfenceExecution: PurfenceExecution;
  purfenceExecutions: PurfenceExecutionConnection;
  purfenceIssue: PurfenceIssue;
  purfenceIssues: PurfenceIssueConnection;
  purfenceListIssueArtifactFiles: Array<Scalars['String']['output']>;
  purfenceProject: PurfenceProject;
  purfenceProjects: PurfenceProjectConnection;
  purfenceReadIssueArtifactFile: Scalars['String']['output'];
  /** ping test */
  hello: Maybe<Scalars['JSON']['output']>;
  modelProviderConfigDto: ModelProviderConfigDto;
  modelProviderConfigDtos: ModelProviderConfigDtoConnection;
  purfenceConfig: PurfenceConfig;
  purfenceConfigs: PurfenceConfigConnection;
};


export type QueryClaudeCodeConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryClaudeCodeConfigsArgs = {
  filter?: ClaudeCodeConfigFilter;
  paging?: OffsetPaging;
  sorting?: Array<ClaudeCodeConfigSort>;
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


export type QueryModelProviderConfigDtoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryModelProviderConfigDtosArgs = {
  filter?: ModelProviderConfigDtoFilter;
  paging?: OffsetPaging;
  sorting?: Array<ModelProviderConfigDtoSort>;
};


export type QueryPurfenceConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurfenceConfigsArgs = {
  filter?: PurfenceConfigFilter;
  paging?: OffsetPaging;
  sorting?: Array<PurfenceConfigSort>;
};

export type QuotaInfo = {
  __typename?: 'QuotaInfo';
  remaining: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
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

export type UpdateOneClaudeCodeConfigInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: ClaudeCodeConfigUpdateInput;
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

export type UpdateOneModelProviderConfigDtoInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: ModelProviderConfigUpdateInput;
};

export type UpdateOnePurfenceConfigInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: PurfenceConfigUpdateInput;
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

export type CreateOnePurfenceProjectMutationVariables = Exact<{
  input: CreateOnePurfenceProjectInput;
}>;


export type CreateOnePurfenceProjectMutation = { __typename?: 'Mutation', createOnePurfenceProject: { __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, externalPath: string | null, defaultBranch: string, createdAt: any, updatedAt: any } };

export type CreateOnePurfenceIssueMutationVariables = Exact<{
  input: CreateOnePurfenceIssueInput;
}>;


export type CreateOnePurfenceIssueMutation = { __typename?: 'Mutation', createOnePurfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId: string | null, createdAt: any, updatedAt: any, workdir: string | null } };

export type PurfenceProjectsQueryVariables = Exact<{
  paging: InputMaybe<OffsetPaging>;
  filter: InputMaybe<PurfenceProjectFilter>;
  sorting: InputMaybe<Array<PurfenceProjectSort> | PurfenceProjectSort>;
}>;


export type PurfenceProjectsQuery = { __typename?: 'Query', purfenceProjects: { __typename?: 'PurfenceProjectConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, createdAt: any, updatedAt: any }> } };

export type PurfenceIssueQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceIssueQuery = { __typename?: 'Query', purfenceIssue: { __typename?: 'PurfenceIssue', id: string, projectId: string, title: string, description: string, status: PurfenceStatus, latestExecutionId: string | null, workdir: string | null, createdAt: any, updatedAt: any } };

export type PurfenceProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PurfenceProjectQuery = { __typename?: 'Query', purfenceProject: { __typename?: 'PurfenceProject', id: string, name: string | null, description: string | null, localRootPath: string, createdAt: any, updatedAt: any } };

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

export type InitiateCodexOAuthMutationVariables = Exact<{
  redirectUri: Scalars['String']['input'];
}>;


export type InitiateCodexOAuthMutation = { __typename?: 'Mutation', initiateCodexOAuth: { __typename?: 'OAuthAuthorization', authorizationUrl: string, state: string } };

export type HandleCodexOAuthCallbackMutationVariables = Exact<{
  code: Scalars['String']['input'];
  state: Scalars['String']['input'];
  redirectUri: Scalars['String']['input'];
}>;


export type HandleCodexOAuthCallbackMutation = { __typename?: 'Mutation', handleCodexOAuthCallback: { __typename?: 'OAuthCallbackResponse', email: string, quota: { __typename?: 'QuotaInfo', total: number, used: number, remaining: number }, oauthInfo: { __typename?: 'CodexOAuthInfoObject', accessToken: string, refreshToken: string, idToken: string | null, tokenType: string, scope: string | null, expiresAt: number, accountId: string | null } } };

export type RefreshCodexTokenMutationVariables = Exact<{
  configId: Scalars['ID']['input'];
}>;


export type RefreshCodexTokenMutation = { __typename?: 'Mutation', refreshCodexToken: { __typename?: 'ModelProviderConfigDto', id: string, name: string, provider: ProviderType, isActive: boolean, createdAt: any, updatedAt: any } };

export type GetClaudeCodeConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetClaudeCodeConfigsQuery = { __typename?: 'Query', claudeCodeConfigs: { __typename?: 'ClaudeCodeConfigConnection', totalCount: number, nodes: Array<{ __typename?: 'ClaudeCodeConfig', id: string, useDefaultConfig: boolean, modelProviderId: string | null, createdAt: any, updatedAt: any, env: Array<{ __typename?: 'ClaudeCodeEnvItem', key: string, value: string }> | null }> } };

export type CreateClaudeCodeConfigMutationVariables = Exact<{
  input: CreateOneClaudeCodeConfigInput;
}>;


export type CreateClaudeCodeConfigMutation = { __typename?: 'Mutation', createOneClaudeCodeConfig: { __typename?: 'ClaudeCodeConfig', id: string, useDefaultConfig: boolean, modelProviderId: string | null, createdAt: any, updatedAt: any, env: Array<{ __typename?: 'ClaudeCodeEnvItem', key: string, value: string }> | null } };

export type UpdateClaudeCodeConfigMutationVariables = Exact<{
  input: UpdateOneClaudeCodeConfigInput;
}>;


export type UpdateClaudeCodeConfigMutation = { __typename?: 'Mutation', updateOneClaudeCodeConfig: { __typename?: 'ClaudeCodeConfig', id: string, useDefaultConfig: boolean, modelProviderId: string | null, createdAt: any, updatedAt: any, env: Array<{ __typename?: 'ClaudeCodeEnvItem', key: string, value: string }> | null } };

export type GetProviderOptionsForClaudeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProviderOptionsForClaudeQuery = { __typename?: 'Query', modelProviderConfigDtos: { __typename?: 'ModelProviderConfigDtoConnection', nodes: Array<{ __typename?: 'ModelProviderConfigDto', id: string, name: string, provider: ProviderType, isActive: boolean }> } };

export type GetProviderConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProviderConfigsQuery = { __typename?: 'Query', modelProviderConfigDtos: { __typename?: 'ModelProviderConfigDtoConnection', totalCount: number, nodes: Array<{ __typename?: 'ModelProviderConfigDto', id: string, provider: ProviderType, name: string, email: string | null, baseUrl: string | null, isActive: boolean, isDefault: boolean, createdAt: any, updatedAt: any }> } };

export type GetProviderConfigQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProviderConfigQuery = { __typename?: 'Query', modelProviderConfigDto: { __typename?: 'ModelProviderConfigDto', id: string, provider: ProviderType, name: string, email: string | null, baseUrl: string | null, isActive: boolean, isDefault: boolean, createdAt: any, updatedAt: any } };

export type CreateProviderConfigMutationVariables = Exact<{
  input: CreateOneModelProviderConfigDtoInput;
}>;


export type CreateProviderConfigMutation = { __typename?: 'Mutation', createOneModelProviderConfigDto: { __typename?: 'ModelProviderConfigDto', id: string, provider: ProviderType, name: string, email: string | null, baseUrl: string | null, isActive: boolean, isDefault: boolean, createdAt: any } };

export type UpdateProviderConfigMutationVariables = Exact<{
  input: UpdateOneModelProviderConfigDtoInput;
}>;


export type UpdateProviderConfigMutation = { __typename?: 'Mutation', updateOneModelProviderConfigDto: { __typename?: 'ModelProviderConfigDto', id: string, provider: ProviderType, name: string, email: string | null, baseUrl: string | null, isActive: boolean, isDefault: boolean, updatedAt: any } };

export type DeleteProviderConfigMutationVariables = Exact<{
  input: DeleteOneModelProviderConfigDtoInput;
}>;


export type DeleteProviderConfigMutation = { __typename?: 'Mutation', deleteOneModelProviderConfigDto: { __typename?: 'ModelProviderConfigDtoDeleteResponse', id: string | null } };

export type ToggleProviderEnabledMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type ToggleProviderEnabledMutation = { __typename?: 'Mutation', toggleModelProviderConfig: { __typename?: 'ModelProviderConfigDto', id: string, isActive: boolean } };

export type GetPurfenceConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPurfenceConfigsQuery = { __typename?: 'Query', purfenceConfigs: { __typename?: 'PurfenceConfigConnection', totalCount: number, nodes: Array<{ __typename?: 'PurfenceConfig', id: string, proxyUrl: string | null, createdAt: any, updatedAt: any }> } };

export type CreatePurfenceConfigMutationVariables = Exact<{
  input: CreateOnePurfenceConfigInput;
}>;


export type CreatePurfenceConfigMutation = { __typename?: 'Mutation', createOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, proxyUrl: string | null, createdAt: any, updatedAt: any } };

export type UpdatePurfenceConfigMutationVariables = Exact<{
  input: UpdateOnePurfenceConfigInput;
}>;


export type UpdatePurfenceConfigMutation = { __typename?: 'Mutation', updateOnePurfenceConfig: { __typename?: 'PurfenceConfig', id: string, proxyUrl: string | null, createdAt: any, updatedAt: any } };
