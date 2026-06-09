export const sampleDbml = `Project "Commerce Workspace" {
  database_type: "PostgreSQL"
  Note: "Small schema for validating DBML import and ERD rendering"
}

Enum order_status {
  pending
  paid
  cancelled
}

Table users {
  id integer [pk, increment]
  email varchar [unique, not null]
  name varchar
  created_at timestamp [not null]

  indexes {
    email [unique, name: "users_email_idx"]
  }
}

Table orders {
  id integer [pk, increment]
  user_id integer [not null]
  status order_status [not null]
  total decimal [not null]
  created_at timestamp [not null]
}

Table order_items {
  id integer [pk, increment]
  order_id integer [not null]
  sku varchar [not null]
  quantity integer [not null]
}

Ref: orders.user_id > users.id [delete: cascade, update: cascade]
Ref: orders.id - order_items.order_id
Ref: users.id <> order_items.id
`

