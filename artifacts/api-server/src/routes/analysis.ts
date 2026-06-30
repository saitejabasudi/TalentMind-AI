import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, jobsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { analyzeCandidateWithGemini } from "../lib/gemini";
import { logger } from "../lib/logger";

const router = Router();

function parseSkills(skillsJson: string): string[] {
  try { return JSON.parse(skillsJson) as string[]; } catch { return []; }
}

// POST /api/analysis/rank — rank all candidates for a job
router.post("/rank", async (req, res) => {
  try {
    const { jobId } = req.body as { jobId: number };
    if (!jobId) { res.status(400).json({ error: "jobId is required" }); return; }

    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId));

    if (candidates.length === 0) {
      res.json([]);
      return;
    }

    // Analyze all candidates
    const analyzed = await Promise.all(
      candidates.map(async (c) => {
        try {
          const analysis = await analyzeCandidateWithGemini(
            job.title,
            job.description,
            job.requirements,
            c.name,
            parseSkills(c.skills),
            c.experienceYears,
            c.education,
            c.resumeText,
          );
          return { candidate: c, analysis, error: null };
        } catch (err) {
          logger.warn({ err, candidateId: c.id }, "Failed to analyze candidate");
          return { candidate: c, analysis: null, error: String(err) };
        }
      })
    );

    // Sort by aiScore descending and assign ranks
    const sorted = analyzed
      .filter(a => a.analysis !== null)
      .sort((a, b) => (b.analysis!.aiScore) - (a.analysis!.aiScore));

    const updated = await Promise.all(
      sorted.map(async ({ candidate, analysis }, idx) => {
        const [updated] = await db
          .update(candidatesTable)
          .set({
            aiScore: analysis!.aiScore,
            skillMatchScore: analysis!.skillMatchScore,
            experienceMatchScore: analysis!.experienceMatchScore,
            aiRecommendation: analysis!.aiRecommendation,
            aiSummary: analysis!.aiSummary,
            rank: idx + 1,
          })
          .where(eq(candidatesTable.id, candidate.id))
          .returning();
        return updated;
      })
    );

    res.json(updated.map(c => ({
      ...c,
      skills: parseSkills(c.skills),
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "Failed to rank candidates");
    res.status(500).json({ error: "Failed to rank candidates" });
  }
});

// POST /api/analysis/candidate/:id — analyze single candidate
router.post("/candidate/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { jobId } = req.body as { jobId: number };
    if (!jobId) { res.status(400).json({ error: "jobId is required" }); return; }

    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

    const analysis = await analyzeCandidateWithGemini(
      job.title,
      job.description,
      job.requirements,
      candidate.name,
      parseSkills(candidate.skills),
      candidate.experienceYears,
      candidate.education,
      candidate.resumeText,
    );

    const [updated] = await db
      .update(candidatesTable)
      .set({
        aiScore: analysis.aiScore,
        skillMatchScore: analysis.skillMatchScore,
        experienceMatchScore: analysis.experienceMatchScore,
        aiRecommendation: analysis.aiRecommendation,
        aiSummary: analysis.aiSummary,
        jobId,
      })
      .where(eq(candidatesTable.id, id))
      .returning();

    res.json({
      ...updated,
      skills: parseSkills(updated.skills),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to analyze candidate");
    res.status(500).json({ error: "Failed to analyze candidate" });
  }
});

export default router;
