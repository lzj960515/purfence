import {
  DocumentNode,
  GraphQLEnumValue,
  GraphQLFieldMap,
  GraphQLInputFieldMap,
  GraphQLNamedType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isObjectType,
  parse,
  validate,
} from 'graphql';
import _ from 'lodash';

export class GraphqlSchemaReader {
  constructor(private schema: GraphQLSchema) {}

  getQuery(operationName: string) {
    const operation = this.schema.getQueryType().getFields()[operationName];

    if (!operation) return `Operation ${operationName} not found`;

    const {
      description: operationDescription,
      args,
      type,
      deprecationReason,
    } = operation;
    const operationArgs = [];
    for (const { name, description, type, deprecationReason } of args) {
      operationArgs.push({
        name,
        description,
        type,
        deprecationReason,
      });
    }
    return {
      name: operationName,
      description: operationDescription,
      args: operationArgs,
      type,
      deprecationReason,
    };
  }

  getMutation(operationName: string) {
    const operation = this.schema.getMutationType().getFields()[operationName];

    if (!operation) return `Operation ${operationName} not found`;

    const {
      description: operationDescription,
      args,
      type,
      deprecationReason,
    } = operation;
    const operationArgs = [];
    for (const { name, description, type, deprecationReason } of args) {
      operationArgs.push({
        name,
        description,
        type,
        deprecationReason,
      });
    }
    return {
      name: operationName,
      description: operationDescription,
      args: operationArgs,
      type,
      deprecationReason,
    };
  }

  getType(typeName: string) {
    const type = this.schema.getType(typeName);

    if (!type) return `Type ${typeName} not found`;

    const formatType = (type: GraphQLNamedType) => {
      if (isObjectType(type) || isInputObjectType(type)) {
        return {
          name: type.name,
          description: type.description,
          fields: formatFields(type.getFields()),
        };
      } else if (isEnumType(type)) {
        return {
          name: type.name,
          description: type.description,
          enums: formatEnums(type.getValues()),
        };
      } else {
        return {
          name: type.name,
          description: type.description,
        };
      }
    };

    const formatEnums = (values: readonly GraphQLEnumValue[]) => {
      const items: {
        name: string;
        description?: string;
        deprecationReason?: string;
      }[] = [];
      for (const { name, description, deprecationReason } of values) {
        items.push({
          name,
          description,
          deprecationReason,
        });
      }
      return items;
    };

    const formatFields = (
      fields: GraphQLFieldMap<any, any> | GraphQLInputFieldMap,
    ) => {
      const items: {
        name: string;
        description?: string;
        type: string;
        deprecationReason?: string;
      }[] = [];
      for (const {
        name,
        description,
        type,
        deprecationReason,
      } of Object.values(fields)) {
        items.push({
          name,
          description,
          type: type.toString(),
          deprecationReason,
        });
      }
      return items;
    };

    return formatType(type);
  }

  validateQuery(query: string | DocumentNode) {
    const documentAST = _.isString(query) ? parse(query) : query;

    // 使用GraphQL的validate函数验证查询
    const validationErrors = validate(this.schema, documentAST);

    // 如果有验证错误，抛出错误
    if (validationErrors.length > 0) {
      throw new Error(
        `GraphQL validation errors: ${JSON.stringify(validationErrors)}`,
      );
    }

    return documentAST;
  }
}
