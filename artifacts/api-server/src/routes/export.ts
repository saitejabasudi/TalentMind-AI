import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, jobsTable } from "@workspace/db";
import { eq, asc, isNotNull } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function parseSkills(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

async function getCandidatesForExport(jobId: number | null) {
  const rows = jobId
    ? await db.select().from(candidatesTable).where(eq(candidatesTable.jobId, jobId)).orderBy(asc(candidatesTable.rank))
    : await db.select().from(candidatesTable).orderBy(asc(candidatesTable.rank));
  return rows.map(c => ({ ...c, skills: parseSkills(c.skills) }));
}

// GET /api/export/csv
router.get("/csv", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    const candidates = await getCandidatesForExport(jobId);

    const headers = ["Rank", "Name", "Email", "Skills", "Experience (Years)", "Education", "AI Score", "Skill Match %", "Experience Match %", "Recommendation", "Summary"];
    const rows = candidates.map(c => [
      c.rank ?? "",
      c.name,
      c.email,
      c.skills.join("; "),
      c.experienceYears,
      `"${(c.education || "").replace(/"/g, '""')}"`,
      c.aiScore ?? "",
      c.skillMatchScore ?? "",
      c.experienceMatchScore ?? "",
      c.aiRecommendation ?? "",
      `"${(c.aiSummary || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ranked_candidates.csv");
    res.send(csv);
  } catch (err) {
    logger.error({ err }, "Failed to export CSV");
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// GET /api/export/xlsx
router.get("/xlsx", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    const candidates = await getCandidatesForExport(jobId);

    const XLSX = await import("xlsx");
    const ws_data = [
      ["Rank", "Name", "Email", "Skills", "Experience (Years)", "Education", "AI Score", "Skill Match %", "Experience Match %", "Recommendation", "Summary"],
      ...candidates.map(c => [
        c.rank ?? "",
        c.name,
        c.email,
        c.skills.join("; "),
        c.experienceYears,
        c.education,
        c.aiScore ?? "",
        c.skillMatchScore ?? "",
        c.experienceMatchScore ?? "",
        c.aiRecommendation ?? "",
        c.aiSummary ?? "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ranked Candidates");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=ranked_candidates.xlsx");
    res.send(buf);
  } catch (err) {
    logger.error({ err }, "Failed to export XLSX");
    res.status(500).json({ error: "Failed to export XLSX" });
  }
});

// GET /api/export/pdf
router.get("/pdf", async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null;
    const candidates = await getCandidatesForExport(jobId);
    const jobs = await db.select().from(jobsTable);
    const activeJob = jobs.find(j => j.isActive) ?? jobs[0];

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=recruiter_report.pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("TalentMind AI", { align: "center" });
    doc.fontSize(14).font("Helvetica").text("Recruiter Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    if (activeJob) {
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text(`Job: ${activeJob.title}`, { align: "center" });
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Summary stats
    const analyzed = candidates.filter(c => c.aiScore !== null);
    const avgScore = analyzed.length > 0 ? analyzed.reduce((s, c) => s + (c.aiScore ?? 0), 0) / analyzed.length : 0;

    doc.fontSize(14).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Candidates: ${candidates.length}`);
    doc.text(`Analyzed Candidates: ${analyzed.length}`);
    doc.text(`Average AI Score: ${avgScore.toFixed(1)}/100`);
    doc.moveDown(1);

    // Candidates
    doc.fontSize(14).font("Helvetica-Bold").text("Ranked Candidates");
    doc.moveDown(0.5);

    const ranked = [...candidates].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    for (const c of ranked) {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font("Helvetica-Bold").text(`#${c.rank ?? "—"} ${c.name}`);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Email: ${c.email}  |  Experience: ${c.experienceYears} years  |  Education: ${c.education}`);
      doc.text(`Skills: ${c.skills.join(", ")}`);
      if (c.aiScore !== null) {
        doc.text(`AI Score: ${c.aiScore}/100  |  Skill Match: ${c.skillMatchScore ?? "—"}%  |  Experience Match: ${c.experienceMatchScore ?? "—"}%  |  Recommendation: ${c.aiRecommendation ?? "—"}`);
      }
      if (c.aiSummary) {
        doc.text(`Summary: ${c.aiSummary}`);
      }
      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor("#cccccc").stroke();
      doc.moveDown(0.5);
    }

    doc.end();
  } catch (err) {
    logger.error({ err }, "Failed to export PDF");
    res.status(500).json({ error: "Failed to export PDF" });
  }
});

export default router;
