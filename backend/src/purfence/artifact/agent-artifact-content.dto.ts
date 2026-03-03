import {
  Field,
  InterfaceType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLBoolean, GraphQLString } from 'graphql';
import { GraphQLURL } from 'graphql-scalars';

export enum AgentArtifactType {
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

registerEnumType(AgentArtifactType, {
  name: 'AgentArtifactType',
  description: 'Type of agent artifact content',
});

export enum AgentArtifactFileType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  XLSX = 'XLSX',
}

registerEnumType(AgentArtifactFileType, {
  name: 'AgentArtifactFileType',
  description: 'Type of file artifact',
});

interface AgentArtifactBaseContent {
  type: AgentArtifactType;
}

export interface AgentArtifactImageContent extends AgentArtifactBaseContent {
  type: AgentArtifactType.IMAGE;
  url: string;
}

export interface AgentArtifactFileContent extends AgentArtifactBaseContent {
  type: AgentArtifactType.FILE;
  fileType: AgentArtifactFileType;
  fileUrl: string;
  filename: string;
}

export interface AgentArtifactPdfContent extends AgentArtifactFileContent {
  fileType: AgentArtifactFileType.PDF;
}

export type AgentArtifactContent =
  | AgentArtifactImageContent
  | AgentArtifactFileContent;

@InterfaceType({
  resolveType(value: AgentArtifactContent) {
    switch (value.type) {
      case AgentArtifactType.IMAGE:
        return AgentArtifactImageContentDto;
      case AgentArtifactType.FILE:
        return AgentArtifactFileContentDto;
      default:
        return null;
    }
  },
})
export abstract class AgentArtifactContentDto {
  @Field(() => AgentArtifactType)
  type: AgentArtifactType;

  @Field(() => GraphQLBoolean, { nullable: true })
  footer?: boolean;

  @Field(() => GraphQLBoolean, { nullable: true })
  chunk?: string;
}

@ObjectType({ implements: [AgentArtifactContentDto] })
export class AgentArtifactImageContentDto extends AgentArtifactContentDto {
  @Field(() => GraphQLURL)
  url: string;
}

@ObjectType({ implements: [AgentArtifactContentDto] })
export class AgentArtifactFileContentDto extends AgentArtifactContentDto {
  @Field(() => AgentArtifactFileType)
  fileType: AgentArtifactFileType;

  @Field(() => GraphQLURL)
  fileUrl: string;

  @Field(() => GraphQLString)
  filename: string;
}
