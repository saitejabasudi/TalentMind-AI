import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function parseCandidate(c: typeof candidatesTable.$inferSelect) {
  let skills: string[] = [];
  try { skills = JSON.parse(c.skills) as string[]; } catch { skills = []; }
  return {
    ...c,
    skills,
    createdAt: c.createdAt.toISOString(),
  };
}

// GET /api/candidates
router.get("/", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    let query = db.select().from(candidatesTable);
    if (jobId) {
      const rows = await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId)).orderBy(asc(candidatesTable.rank));
      res.json(rows.map(parseCandidate));
      return;
    }
    const rows = await query.orderBy(asc(candidatesTable.rank));
    res.json(rows.map(parseCandidate));
  } catch (err) {
    logger.error({ err }, "Failed to list candidates");
    res.status(500).json({ error: "Failed to list candidates" });
  }
});

// POST /api/candidates
router.post("/", async (req, res) => {
  try {
    const { name, email, skills, experienceYears, education, resumeText, jobId } = req.body as {
      name: string; email: string; skills: string[]; experienceYears: number;
      education: string; resumeText?: string; jobId?: number | null;
    };
    if (!name || !email) { res.status(400).json({ error: "name and email are required" }); return; }
    const [c] = await db.insert(candidatesTable).values({
      name, email,
      skills: JSON.stringify(skills ?? []),
      experienceYears: experienceYears ?? 0,
      education: education ?? "",
      resumeText: resumeText ?? null,
      jobId: jobId ?? null,
    }).returning();
    res.status(201).json(parseCandidate(c));
  } catch (err) {
    logger.error({ err }, "Failed to create candidate");
    res.status(500).json({ error: "Failed to create candidate" });
  }
});

// POST /api/candidates/import-csv
router.post("/import-csv", async (req, res) => {
  try {
    const { csvData, jobId } = req.body as { csvData: string; jobId?: number | null };
    if (!csvData) { res.status(400).json({ error: "csvData is required" }); return; }

    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    const errors: string[] = [];
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      try {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

        const name = row["name"] || row["full name"] || row["fullname"] || "";
        const email = row["email"] || row["email address"] || "";
        const skillsRaw = row["skills"] || "";
        const expRaw = row["experience"] || row["experience years"] || row["years"] || "0";
        const education = row["education"] || row["degree"] || "";
        const resumeText = row["resume"] || row["summary"] || "";

        if (!name || !email) {
          errors.push(`Row ${i + 1}: missing name or email`);
          continue;
        }

        const skills = skillsRaw ? skillsRaw.split(";").map(s => s.trim()).filter(Boolean) : [];
        const experienceYears = parseFloat(expRaw) || 0;

        await db.insert(candidatesTable).values({
          name, email,
          skills: JSON.stringify(skills),
          experienceYears,
          education,
          resumeText: resumeText || null,
          jobId: jobId ?? null,
        });
        imported++;
      } catch (rowErr) {
        errors.push(`Row ${i + 1}: ${String(rowErr)}`);
      }
    }

    res.json({ imported, errors });
  } catch (err) {
    logger.error({ err }, "Failed to import CSV");
    res.status(500).json({ error: "Failed to import CSV" });
  }
});

// GET /api/candidates/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [c] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(parseCandidate(c));
  } catch (err) {
    logger.error({ err }, "Failed to get candidate");
    res.status(500).json({ error: "Failed to get candidate" });
  }
});

// PATCH /api/candidates/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, skills, experienceYears, education, resumeText } = req.body as {
      name?: string; email?: string; skills?: string[]; experienceYears?: number;
      education?: string; resumeText?: string;
    };
    const updates: Partial<typeof candidatesTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (skills !== undefined) updates.skills = JSON.stringify(skills);
    if (experienceYears !== undefined) updates.experienceYears = experienceYears;
    if (education !== undefined) updates.education = education;
    if (resumeText !== undefined) updates.resumeText = resumeText;

    const [c] = await db.update(candidatesTable).set(updates).where(eq(candidatesTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(parseCandidate(c));
  } catch (err) {
    logger.error({ err }, "Failed to update candidate");
    res.status(500).json({ error: "Failed to update candidate" });
  }
});

// DELETE /api/candidates/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(candidatesTable).where(eq(candidatesTable.id, id));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete candidate");
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

export default router;
