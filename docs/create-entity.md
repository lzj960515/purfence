---
description: Create a complete NestJS entity with all required files following project conventions
argument-hint: [entity-name] [fields-description]
---

# Create NestJS Entity Command

You are creating a complete NestJS entity following the Pietra AI API project conventions. This command will generate all necessary files with proper structure and patterns.

## Project Architecture Context

This is a NestJS-based API service using:

- **TypeORM**: Database ORM with entity definitions
- **GraphQL**: API layer with auto-generated resolvers using `@ptc-org/nestjs-query-graphql`
- **Entity Pattern**: All entities use `.entity.ts` suffix
- **Authorization**: Role-based access control (ADMIN, STORE)
- **Snowflake IDs**: Unique entity identification via BaseEntity

## Required Files Structure

For an entity named `XxxYyy`, create these files in `src/purfence/xxx-yyy/`:

1. **Entity**: `xxx-yyy.entity.ts`
2. **DTO**: `xxx-yyy.dto.ts`
3. **Create Input**: `xxx-yyy-create.input.ts`
4. **Update Input**: `xxx-yyy-update.input.ts`
5. **Module**: `xxx-yyy.module.ts`

## Critical Requirements

### 1. Entity File (`xxx-yyy.entity.ts`)

**Pattern:**

```typescript
import { BaseEntity, IDColumnOpts } from "@app/shared";
import { Column, Entity } from "typeorm";

@Entity()
export class XxxYyy extends BaseEntity {
  @Column({ ...IDColumnOpts })
  entityId: string; // For ID references (foreign keys)

  @Column({ type: "text" })
  textField: string;

  @Column({ type: "text", nullable: true })
  optionalField?: string;

  @Column({ type: "json" })
  jsonArrayField: string[];
}
```

**Rules:**

- ✅ MUST extend `BaseEntity` (provides id, createdAt, updatedAt)
- ✅ MUST use `@Entity()` decorator
- ✅ MUST import and use `IDColumnOpts` for ID fields (like `storeId`, `userId`, `cardId`, etc.)
- ❌ DO NOT add logger constant
- Use `{ ...IDColumnOpts }` for ID reference fields (foreign keys, entity IDs)
- Use `type: 'varchar'` for regular string fields
- Use `type: 'json'` for arrays/objects
- Add `nullable: true` for optional fields

### 2. DTO File (`xxx-yyy.dto.ts`)

**Pattern**

```typescript
import { BaseDto } from "@app/shared";
import { Field, ObjectType } from "@nestjs/graphql";
import { FilterableField } from "@ptc-org/nestjs-query-graphql";

@ObjectType("XxxYyy")
export class XxxYyyDto extends BaseDto {
  @FilterableField()
  requiredField: string;

  @Field({ nullable: true })
  optionalField?: string;

  @Field(() => [String])
  arrayField: string[];
}
```

**Rules:**

- ✅ MUST extend `BaseDto` (provides id, createdAt, updatedAt)
- Use `@FilterableField()` for fields that need filtering
- Use `@Field()` for regular fields
- Add `{ nullable: true }` for optional fields
- Use `@Field(() => [String])` for string arrays

### 3. Create Input (`xxx-yyy-create.input.ts`)

**Pattern:**

```typescript
import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsArray, IsOptional } from "class-validator";

@InputType()
export class XxxYyyCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  requiredField: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  optionalField?: string;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  arrayField: string[];
}
```

**Rules:**

- Use appropriate validators: `@IsString()`, `@IsArray()`, `@IsNotEmpty()`, `@IsOptional()`
- Required fields: `@IsNotEmpty()`
- Optional fields: `@IsOptional()` + `{ nullable: true }`

### 4. Update Input (`xxx-yyy-update.input.ts`)

**Pattern:**

```typescript
import { InputType, PartialType } from "@nestjs/graphql";
import { XxxYyyCreateInput } from "./xxx-yyy-create.input";

@InputType()
export class XxxYyyUpdateInput extends PartialType(XxxYyyCreateInput) {}
```

**Rules:**

- ✅ MUST use `PartialType` to make all fields optional
- ❌ DO NOT manually redefine fields
- If you need to omit certain fields (like unique identifiers), use:

  ```typescript
  import { InputType, OmitType, PartialType } from "@nestjs/graphql";

  @InputType()
  export class XxxYyyUpdateInput extends PartialType(
    OmitType(XxxYyyCreateInput, ["uniqueFieldName"]),
  ) {}
  ```

### 5. Module File (`xxx-yyy.module.ts`)

**Pattern:**

```typescript
import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from "@ptc-org/nestjs-query-graphql";
import { NestjsQueryTypeOrmModule } from "@ptc-org/nestjs-query-typeorm";
import { XxxYyyCreateInput } from "./xxx-yyy-create.input";
import { XxxYyyUpdateInput } from "./xxx-yyy-update.input";
import { XxxYyy } from "./xxx-yyy.entity";
import { XxxYyyDto } from "./xxx-yyy.dto";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([XxxYyy]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([XxxYyy])],
      resolvers: [
        {
          EntityClass: XxxYyy,
          DTOClass: XxxYyyDto,
          CreateDTOClass: XxxYyyCreateInput,
          UpdateDTOClass: XxxYyyUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [],
  exports: [],
})
export class XxxYyyModule {}
```

**Rules:**

- Disable bulk operations: `many: { disabled: true }`
- Enable pagination: `pagingStrategy: PagingStrategies.OFFSET`
- Enable total count: `enableTotalCount: true`

**Rules:**

- Use a short, memorable prefix (2-6 characters)
- Must be unique across all entities
- Use lowercase for the prefix value

### 7. Import Module in Parent Module

In `src/purfence/purfence.module.ts`:

```typescript
// Add import at top
import { XxxYyyModule } from './xxx-yyy/xxx-yyy.module';

// Add to imports array
@Module({
  imports: [
    ...
    XxxYyyModule,
  ],
  ...
})
```

## Common Field Type Examples

### ID Field (Required) - For entity references

```typescript
// Entity
import { BaseEntity, IDColumnOpts } from '@app/shared';

@Column({ ...IDColumnOpts })
storeId: string;

// DTO
@FilterableField()
storeId: string;

// Create Input
@Field()
@IsString()
@IsNotEmpty()
storeId: string;
```

### ID Field (Optional) - For optional entity references

```typescript
// Entity
@Column({ ...IDColumnOpts, nullable: true })
userId?: string;

// DTO
@Field({ nullable: true })
userId?: string;

// Create Input
@Field({ nullable: true })
@IsString()
@IsOptional()
userId?: string;
```

### String Field (Required)

```typescript
// Entity
@Column({ type: 'text' })
fieldName: string;

// DTO
@FilterableField()
fieldName: string;

// Create Input
@Field()
@IsString()
@IsNotEmpty()
fieldName: string;
```

### String Field (Optional)

```typescript
// Entity
@Column({ type: 'text', nullable: true })
fieldName?: string;

// DTO
@Field({ nullable: true })
fieldName?: string;

// Create Input
@Field({ nullable: true })
@IsString()
@IsOptional()
fieldName?: string;
```

### String Array (Required)

```typescript
// Entity
@Column({ type: 'json' })
fieldNames: string[];

// DTO
@Field(() => [String])
fieldNames: string[];

// Create Input
@Field(() => [String])
@IsArray()
@IsNotEmpty()
fieldNames: string[];
```

### Boolean Field

```typescript
// Entity
@Column({ type: 'boolean', default: false })
isActive: boolean;

// DTO
@Field()
isActive: boolean;

// Create Input
@Field({ defaultValue: false })
@IsBoolean()
isActive: boolean;
```

### JSON Object Field

```typescript
// Entity
@Column({ type: 'json', nullable: true })
metadata: Record<string, any>;

// DTO
@Field(() => GraphQLJSONObject, { nullable: true })
metadata?: Record<string, any>;

// Create Input
@Field(() => GraphQLJSONObject, { nullable: true })
@IsOptional()
metadata?: Record<string, any>;
```

## Field Type Reference

- `string(required)` → text column, non-nullable
- `string(optional)` → text column, nullable
- `array(required)` → json column for string array, non-nullable
- `array(optional)` → json column for string array, nullable
- `boolean` → boolean column with default value
- `json(optional)` → json column for object, nullable

## Execution Steps

When this command is invoked:

1. Parse the entity name (convert to PascalCase for class, kebab-case for files)
2. Parse field definitions from the arguments
3. Create the folder: `src/purfence/{kebab-case-name}/`
4. Generate all 5 required files following the patterns above
5. Import the module in `src/purfence/purfence.module.ts`
6. Verify no TypeScript errors (check imports are correct)
7. Do NOT start any services or run migrations

## Important Reminders

- ❌ NEVER include `const logger = new Logger('...')` in entity files
- ❌ NEVER manually define `id`, `createdAt`, `updatedAt` (comes from BaseEntity/BaseDto)
- ✅ ALWAYS import `IDColumnOpts` from `@app/shared` when entity has ID reference fields
- ✅ ALWAYS use `{ ...IDColumnOpts }` for ID fields (storeId, userId, cardId, etc.)
- ✅ ALWAYS use `BaseEntity` for entities and `BaseDto` for DTOs
- ✅ ALWAYS use `PartialType` for update inputs
- ✅ ALWAYS disable bulk operations in module configuration
- ✅ ALWAYS add the entity to both TypeOrmModule and NestjsQueryTypeOrmModule
- ❌ DO NOT create or run database migrations (handled automatically)
- ❌ DO NOT start development server automatically

---

**Now process the user's entity creation request using $ARGUMENTS:**

Entity to create: $ARGUMENTS

Parse this input and generate all required files following the exact patterns and rules above.
