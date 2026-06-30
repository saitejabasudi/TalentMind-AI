import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  skills: text("skills").notNull().default("[]"), // JSON array stored as text
  experienceYears: real("experience_years").notNull().default(0),
  education: text("education").notNull().default(""),
  resumeText: text("resume_text"),
  aiScore: real("ai_score"),
  skillMatchScore: real("skill_match_score"),
  experienceMatchScore: real("experience_match_score"),
  aiRecommendation: text("ai_recommendation"),
  aiSummary: text("ai_summary"),
  rank: integer("rank"),
  jobId: integer("job_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
