import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const repositories = pgTable("repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  description: text("description"),
  language: text("language"),
  fileStructure: jsonb("file_structure"),
  analysisStatus: text("analysis_status").notNull().default("pending"), // pending, analyzing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentations = pgTable("documentations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull().references(() => repositories.id),
  type: text("type").notNull(), // readme, api, comments
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisJobs = pgTable("analysis_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull().references(() => repositories.id),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: text("progress").default("0"),
  currentFile: text("current_file"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentationSchema = createInsertSchema(documentations).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Documentation = typeof documentations.$inferSelect;
export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;
