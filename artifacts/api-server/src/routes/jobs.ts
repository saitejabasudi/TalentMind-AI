import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);
    res.json(jobs.map(j => ({
      ...j,
      createdAt: j.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// POST /api/jobs
router.post("/", async (req, res) => {
  try {
    const { title, description, requirements } = req.body as { title: string; description: string; requirements?: string };
    if (!title || !description) {
      res.status(400).json({ error: "title and description are required" });
      return;
    }
    const [job] = await db.insert(jobsTable).values({ title, description, requirements: requirements ?? null, isActive: false }).returning();
    res.status(201).json({ ...job, createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to create job");
    res.status(500).json({ error: "Failed to create job" });
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...job, createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to get job");
    res.status(500).json({ error: "Failed to get job" });
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(jobsTable).where(eq(jobsTable.id, id));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete job");
    res.status(500).json({ error: "Failed to delete job" });
  }
});

// PATCH /api/jobs/:id/active
router.patch("/:id/active", async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Clear all active flags first
    await db.update(jobsTable).set({ isActive: false });
    const [job] = await db.update(jobsTable).set({ isActive: true }).where(eq(jobsTable.id, id)).returning();
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...job, createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to set active job");
    res.status(500).json({ error: "Failed to set active job" });
  }
});

export default router;
