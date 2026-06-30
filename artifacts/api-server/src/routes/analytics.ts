import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, jobsTable } from "@workspace/db";
import { eq, isNotNull, avg, count, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function parseSkills(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

// GET /api/analytics/summary
router.get("/summary", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;

    const allCandidates = jobId
      ? await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId))
      : await db.select().from(candidatesTable);

    const allJobs = await db.select().from(jobsTable);
    const analyzed = allCandidates.filter(c => c.aiScore !== null);
    const avgScore = analyzed.length > 0
      ? analyzed.reduce((sum, c) => sum + (c.aiScore ?? 0), 0) / analyzed.length
      : 0;

    const topCandidates = [...allCandidates]
      .filter(c => c.aiScore !== null)
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))
      .slice(0, 5)
      .map(c => ({ ...c, skills: parseSkills(c.skills), createdAt: c.createdAt.toISOString() }));

    res.json({
      totalCandidates: allCandidates.length,
      totalJobs: allJobs.length,
      analyzedCandidates: analyzed.length,
      avgScore: Math.round(avgScore * 10) / 10,
      topCandidates,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get analytics summary");
    res.status(500).json({ error: "Failed to get analytics summary" });
  }
});

// GET /api/analytics/skill-distribution
router.get("/skill-distribution", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    const candidates = jobId
      ? await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId))
      : await db.select().from(candidatesTable);

    const skillCounts: Record<string, number> = {};
    for (const c of candidates) {
      const skills = parseSkills(c.skills);
      for (const skill of skills) {
        const normalized = skill.trim().toLowerCase();
        if (normalized) skillCounts[normalized] = (skillCounts[normalized] ?? 0) + 1;
      }
    }

    const sorted = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    res.json(sorted);
  } catch (err) {
    logger.error({ err }, "Failed to get skill distribution");
    res.status(500).json({ error: "Failed to get skill distribution" });
  }
});

// GET /api/analytics/score-distribution
router.get("/score-distribution", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    const candidates = jobId
      ? await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId))
      : await db.select().from(candidatesTable);

    const buckets: Record<string, number> = {
      "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0,
    };

    for (const c of candidates) {
      if (c.aiScore === null) continue;
      const s = c.aiScore;
      if (s <= 20) buckets["0-20"]++;
      else if (s <= 40) buckets["21-40"]++;
      else if (s <= 60) buckets["41-60"]++;
      else if (s <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    }

    res.json(Object.entries(buckets).map(([range, count]) => ({ range, count })));
  } catch (err) {
    logger.error({ err }, "Failed to get score distribution");
    res.status(500).json({ error: "Failed to get score distribution" });
  }
});

export default router;
