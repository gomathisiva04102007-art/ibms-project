import { pgTable, text, uuid, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';

export const recordKind = pgEnum('billing_record_kind', ['customers', 'products', 'invoices', 'payments']);

export const workspaces = pgTable('billing_workspaces', {
  userId: text('user_id').primaryKey(),
  profile: jsonb('profile').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Each business record is independently stored and scoped to its Identity owner.
// JSONB preserves the invoice/customer snapshots used by the existing UI.
export const records = pgTable('billing_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => workspaces.userId, { onDelete: 'cascade' }),
  kind: recordKind('kind').notNull(),
  data: jsonb('data').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('billing_records_owner_kind_idx').on(t.userId, t.kind)]);
