import { describe, expect, it } from 'vitest'
import type { SchemaModel } from '../features/dbml/dbmlTypes'
import { parseDbmlSource } from '../features/dbml/dbmlParser'
import { buildRelationSubsetDbml } from '../features/dbml/relationSubsetDbml'
import type { RelationPathResult } from '../features/inspector/relationPath'

describe('relationSubsetDbml', () => {
  it('builds a parseable DBML document from relation path tables and relations', () => {
    const source = buildRelationSubsetDbml(model, pathResult, '用户订单链路')

    expect(source).toContain('Project "用户订单链路"')
    expect(source).toContain('Table users')
    expect(source).toContain('Note: "用户主数据表"')
    expect(source).toContain('email varchar [unique, not null, note: "用户邮箱"]')
    expect(source).toContain('Table orders')
    expect(source).toContain('Table order_items')
    expect(source).not.toContain('Table audit_logs')
    expect(source).toContain('Ref: orders.user_id > users.id [delete: cascade, update: cascade]')
    expect(source).toContain('Ref: order_items.order_id > orders.id')

    const parsed = parseDbmlSource(source)

    expect(parsed.ok).toBe(true)
  })

  it('builds parseable DBML when selected tables contain duplicate type args and complex indexes', () => {
    const source = buildRelationSubsetDbml(complexModel, complexPathResult, '业务分类查询')

    expect(source).toContain('pj_risk_instance_business_id varchar(512)')
    expect(source).toContain('strategy_cover_ratio decimal(10,6)')
    expect(source).toContain('(start_time, project_id) [name: "ee_problem_cold_start_time_IDX"]')
    expect(source).toContain('(project_id, name, is_deleted) [name: "uk_name"]')
    expect(source).not.toContain("json_extract")

    const parsed = parseDbmlSource(source)

    expect(parsed.ok).toBe(true)
  })
})

const model: SchemaModel = {
  project: { name: '原始模型' },
  tables: [
    {
      id: 'users',
      name: 'users',
      note: '用户主数据表',
      columns: [
        {
          id: 'users.id',
          name: 'id',
          type: 'integer',
          isPk: true,
          isUnique: false,
          isNullable: false,
          isIncrement: true,
        },
        {
          id: 'users.email',
          name: 'email',
          type: 'varchar',
          isPk: false,
          isUnique: true,
          isNullable: false,
          isIncrement: false,
          note: '用户邮箱',
        },
      ],
      indexes: [],
    },
    {
      id: 'orders',
      name: 'orders',
      columns: [
        {
          id: 'orders.id',
          name: 'id',
          type: 'integer',
          isPk: true,
          isUnique: false,
          isNullable: false,
          isIncrement: true,
        },
        {
          id: 'orders.user_id',
          name: 'user_id',
          type: 'integer',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
      ],
      indexes: [],
    },
    {
      id: 'order_items',
      name: 'order_items',
      columns: [
        {
          id: 'order_items.order_id',
          name: 'order_id',
          type: 'integer',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
      ],
      indexes: [],
    },
    {
      id: 'audit_logs',
      name: 'audit_logs',
      columns: [],
      indexes: [],
    },
  ],
  relations: [
    {
      id: 'orders_users',
      fromTableId: 'orders',
      fromColumnIds: ['orders.user_id'],
      toTableId: 'users',
      toColumnIds: ['users.id'],
      cardinality: 'many-to-one',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
    {
      id: 'items_orders',
      fromTableId: 'order_items',
      fromColumnIds: ['order_items.order_id'],
      toTableId: 'orders',
      toColumnIds: ['orders.id'],
      cardinality: 'many-to-one',
    },
  ],
  enums: [],
}

const pathResult: RelationPathResult = {
  kind: 'indirect',
  steps: [
    {
      relationId: 'items_orders',
      fromTableId: 'order_items',
      fromColumnIds: ['order_items.order_id'],
      toTableId: 'orders',
      toColumnIds: ['orders.id'],
    },
    {
      relationId: 'orders_users',
      fromTableId: 'orders',
      fromColumnIds: ['orders.user_id'],
      toTableId: 'users',
      toColumnIds: ['users.id'],
    },
  ],
}

const complexModel: SchemaModel = {
  project: { name: 'TYXK_apm-exp' },
  tables: [
    {
      id: 'ee_problem',
      name: 'ee_problem',
      note: '问题记录冷数据',
      columns: [
        {
          id: 'ee_problem.id',
          name: 'id',
          type: 'bigint',
          isPk: true,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
          note: '主键ID',
        },
        {
          id: 'ee_problem.pj_risk_instance_business_id',
          name: 'pj_risk_instance_business_id',
          type: 'varchar(512)(512)',
          isPk: false,
          isUnique: false,
          isNullable: true,
          isIncrement: false,
          note: '项目风险实例id',
        },
        {
          id: 'ee_problem.start_time',
          name: 'start_time',
          type: 'datetime',
          isPk: false,
          isUnique: false,
          isNullable: true,
          isIncrement: false,
        },
        {
          id: 'ee_problem.project_id',
          name: 'project_id',
          type: 'varchar(20)(20)',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
          note: '项目id',
        },
        {
          id: 'ee_problem.finished',
          name: 'finished',
          type: 'tinyint',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
        {
          id: 'ee_problem.search_info',
          name: 'search_info',
          type: 'json',
          isPk: false,
          isUnique: false,
          isNullable: true,
          isIncrement: false,
        },
        {
          id: 'ee_problem.pj_deal_major_id',
          name: 'pj_deal_major_id',
          type: 'bigint',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
          note: '处置项目专业',
        },
      ],
      indexes: [
        {
          id: 'ee_problem.index.start_time',
          name: 'ee_problem_cold_start_time_IDX',
          columns: ['start_time', 'project_id'],
          isPk: false,
          isUnique: false,
        },
        {
          id: 'ee_problem.index.instance_finish',
          name: 'instance_finish_idx',
          columns: ['cast(json_extract("search_info ",_utf8mb4\\\'$.rwdInstanceId\\\') as char(255) charset utf8mb4)'],
          isPk: false,
          isUnique: false,
        },
        {
          id: 'ee_problem.index.finished',
          name: 'pj_risk_instance_business_id_finised_idx',
          columns: ['project_id', 'pj_risk_instance_business_id', 'finished'],
          isPk: false,
          isUnique: false,
        },
      ],
    },
    {
      id: 'pj_deal_major',
      name: 'pj_deal_major',
      note: '项目处理专业',
      columns: [
        {
          id: 'pj_deal_major.id',
          name: 'id',
          type: 'bigint',
          isPk: true,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
        {
          id: 'pj_deal_major.name',
          name: 'name',
          type: 'varchar(512)(512)',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
          note: '处理专业名称',
        },
        {
          id: 'pj_deal_major.project_id',
          name: 'project_id',
          type: 'varchar(20)(20)',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
          note: '项目ID',
        },
        {
          id: 'pj_deal_major.is_deleted',
          name: 'is_deleted',
          type: 'bigint',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
        {
          id: 'pj_deal_major.strategy_cover_ratio',
          name: 'strategy_cover_ratio',
          type: 'decimal(10,6)(10,6)',
          isPk: false,
          isUnique: false,
          isNullable: true,
          isIncrement: false,
        },
      ],
      indexes: [
        {
          id: 'pj_deal_major.index.uk_name',
          name: 'uk_name',
          columns: ['project_id', 'name', 'is_deleted'],
          isPk: false,
          isUnique: false,
        },
      ],
    },
  ],
  relations: [
    {
      id: 'ee_problem_pj_deal_major',
      fromTableId: 'ee_problem',
      fromColumnIds: ['ee_problem.pj_deal_major_id'],
      toTableId: 'pj_deal_major',
      toColumnIds: ['pj_deal_major.id'],
      cardinality: 'many-to-one',
    },
  ],
  enums: [],
}

const complexPathResult: RelationPathResult = {
  kind: 'direct',
  steps: [
    {
      relationId: 'ee_problem_pj_deal_major',
      fromTableId: 'ee_problem',
      fromColumnIds: ['ee_problem.pj_deal_major_id'],
      toTableId: 'pj_deal_major',
      toColumnIds: ['pj_deal_major.id'],
    },
  ],
}
