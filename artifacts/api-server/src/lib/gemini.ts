import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CandidateAnalysis {
  aiScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  aiRecommendation: "Strong Yes" | "Yes" | "Maybe" | "No";
  aiSummary: string;
}

export async function analyzeCandidateWithGemini(
  jobTitle: string,
  jobDescription: string,
  jobRequirements: string | null | undefined,
  candidateName: string,
  candidateSkills: string[],
  candidateExperienceYears: number,
  candidateEducation: string,
  candidateResumeText: string | null | undefined
): Promise<CandidateAnalysis> {
  const prompt = `You are an expert technical recruiter. Analyze this candidate for the given job and provide scores.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
JOB REQUIREMENTS: ${jobRequirements || "Not specified"}

CANDIDATE NAME: ${candidateName}
SKILLS: ${candidateSkills.join(", ")}
EXPERIENCE: ${candidateExperienceYears} years
EDUCATION: ${candidateEducation}
RESUME/NOTES: ${candidateResumeText || "Not provided"}

Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "aiScore": <integer 0-100 overall fit score>,
  "skillMatchScore": <integer 0-100 how well skills match job requirements>,
  "experienceMatchScore": <integer 0-100 how well experience level matches>,
  "aiRecommendation": <"Strong Yes" | "Yes" | "Maybe" | "No">,
  "aiSummary": <2-3 sentence summary of the candidate fit>
}`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as CandidateAnalysis;

    return {
      aiScore: Math.min(100, Math.max(0, Math.round(parsed.aiScore))),
      skillMatchScore: Math.min(100, Math.max(0, Math.round(parsed.skillMatchScore))),
      experienceMatchScore: Math.min(100, Math.max(0, Math.round(parsed.experienceMatchScore))),
      aiRecommendation: parsed.aiRecommendation,
      aiSummary: parsed.aiSummary,
    };
  } catch (err) {
    logger.error({ err }, "Gemini analysis failed");
    throw err;
  }
}
