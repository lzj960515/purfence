---
description: Create a complete Purfence backend entity module following this repo conventions
argument-hint: [module-name] [entity-name] [fields-description]
---

# Create Entity (Purfence)

Use this command to scaffold a **backend Purfence module** with TypeORM entity + GraphQL CRUD inputs/DTO/module.

This command is project-specific for:
- `backend/src/purfence/`
- `nestjs-query` auto CRUD
- Active Record style (`BaseEntity.findOne`, `save`, etc.)

## Required context (read first)

Before generating files, read and follow:
- `AGENTS.md`
- `backend/CLAUDE.md`

## Target output structure

For module `<module-kebab>` (example: `app-config`), create files under:

`backend/src/purfence/<module-kebab>/`

1. `<entity-kebab>.entity.ts`
2. `<entity-kebab>.dto.ts`
3. `<entity-kebab>-create.input.ts`
4. `<entity-kebab>-update.input.ts`
5. `<module-kebab>.module.ts`
6. Optional service/subscriber/resolver files only if user explicitly asks

Do **not** create Java-style folders (`entities/`, `services/`, `controllers/`). Keep files flat.

## Naming rules

- Entity class: `PascalCase` (example: `PurfenceAppConfig`)
- DTO class: `<EntityName>Dto`
- Create input: `<EntityName>CreateInput`
- Update input: `<EntityName>UpdateInput`
- File names: kebab-case

## Entity rules

Pattern:

```typescript
import { BaseEntity } from '@app/shared';
import { Column, Entity } from 'typeorm';

@Entity()
export class XxxYyy extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
```

Rules:
- Must extend `BaseEntity`
- Do not define `id/createdAt/updatedAt` manually
- Use `varchar` for user-facing text fields (Chinese-compatible)
- Use `json` for flexible object/array payloads
- Use `nullable: true` for optional fields

## DTO rules

Pattern:

```typescript
import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';

@ObjectType('XxxYyy')
export class XxxYyyDto extends BaseDto {
  @FilterableField()
  name: string;

  @Field({ nullable: true })
  note?: string;
}
```

Rules:
- Must extend `BaseDto`
- Use `@FilterableField` for fields that should support filtering
- Use `@Field` for regular exposed fields
- If field type is enum, register enum via `registerEnumType` in `backend/src/purfence/types/*.enum.ts`

## Create/Update Input rules

Create input pattern:

```typescript
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class XxxYyyCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  note?: string;
}
```

Update input pattern:

```typescript
import { InputType, PartialType } from '@nestjs/graphql';
import { XxxYyyCreateInput } from './xxx-yyy-create.input';

@InputType()
export class XxxYyyUpdateInput extends PartialType(XxxYyyCreateInput) {}
```

Rules:
- Update input should use `PartialType`
- Avoid manually duplicating update fields

## Module rules (nestjs-query auto CRUD)

Pattern:

```typescript
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { XxxYyyCreateInput } from './xxx-yyy-create.input';
import { XxxYyyDto } from './xxx-yyy.dto';
import { XxxYyy } from './xxx-yyy.entity';
import { XxxYyyUpdateInput } from './xxx-yyy-update.input';

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

Rules:
- Use `PagingStrategies.OFFSET`
- Disable bulk operations (`many`)
- Do not use connection names (`TypeOrmModule.forFeature([...], 'ai')` is forbidden)

## Purfence module integration

After module file creation:
1. Import the new module in `backend/src/purfence/purfence.module.ts`
2. Add it into `imports` array

## GraphQL + frontend conventions

If this entity is used by frontend settings/pages:
- Put hand-written business GraphQL docs under `frontend/src/api/*.graphql.ts`
- Do not place hand-written business docs under `frontend/src/graphql/`
- Run `npm run codegen -w backend` to regenerate:
  - `frontend/src/graphql/__generated__/types.ts`
  - `frontend/src/graphql/__generated__/hooks.ts`

## Validation checklist (must do)

1. File names and class names match conventions
2. Imports use project aliases (`@app/shared`, `@/`)
3. LSP diagnostics are clean for changed files
4. `npm -w backend run build` passes
5. If frontend changed, `npm -w frontend run build` passes

## Input format

Command usage:

```text
/create-entity [module-name] [entity-name] [fields]
```

Examples:

```text
/create-entity app-config PurfenceAppConfig type:enum(required) enabled:boolean config:json(optional)
/create-entity slack-config PurfenceSlackConfig botToken:string(required) appToken:string(required) enabled:boolean
```

## Important prohibitions

- Do not create migrations for this task
- Do not start/stop dev services automatically
- Do not invent folder structures not used in this repo
- Do not add `as any`, `@ts-ignore`, or `@ts-expect-error`

---

Now process `$ARGUMENTS` and scaffold files strictly by the rules above.
