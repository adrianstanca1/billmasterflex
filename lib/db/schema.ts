import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// ─── Construction Billing Schema ────────────────────────────────────────────────

export const client = pgTable('Client', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 128 }),
  phone: varchar('phone', { length: 32 }),
  address: text('address'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export type Client = InferSelectModel<typeof client>;

export const project = pgTable('Project', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  clientId: uuid('clientId').notNull().references(() => client.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  value: varchar('value', { length: 64 }).notNull().default('0'),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  startDate: timestamp('startDate'),
  endDate: timestamp('endDate'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export type Project = InferSelectModel<typeof project>;

export const invoice = pgTable('Invoice', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  clientId: uuid('clientId').notNull().references(() => client.id),
  projectId: uuid('projectId').references(() => project.id),
  invoiceNumber: varchar('invoiceNumber', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  issueDate: timestamp('issueDate').notNull().defaultNow(),
  dueDate: timestamp('dueDate'),
  subtotal: varchar('subtotal', { length: 64 }).notNull().default('0'),
  taxRate: varchar('taxRate', { length: 8 }).notNull().default('0'),
  taxAmount: varchar('taxAmount', { length: 64 }).notNull().default('0'),
  total: varchar('total', { length: 64 }).notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export type Invoice = InferSelectModel<typeof invoice>;

export const invoiceLineItem = pgTable('InvoiceLineItem', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  invoiceId: uuid('invoiceId').notNull().references(() => invoice.id),
  description: text('description').notNull(),
  quantity: varchar('quantity', { length: 20 }).notNull().default('1'),
  unitPrice: varchar('unitPrice', { length: 64 }).notNull().default('0'),
  total: varchar('total', { length: 64 }).notNull().default('0'),
  sortOrder: varchar('sortOrder', { length: 8 }).notNull().default('0'),
});

export type InvoiceLineItem = InferSelectModel<typeof invoiceLineItem>;

export const payment = pgTable('Payment', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  invoiceId: uuid('invoiceId').notNull().references(() => invoice.id),
  amount: varchar('amount', { length: 64 }).notNull().default('0'),
  method: varchar('method', { length: 32 }),
  reference: varchar('reference', { length: 128 }),
  paidAt: timestamp('paidAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Payment = InferSelectModel<typeof payment>;
