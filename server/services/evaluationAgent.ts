import OpenAI from "openai";
import type { Job, Message } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface EvaluationResult {
  overallScore: number;
  decisionQuality: number;
  communicationClarity: number;
  structuredProcess: number;
  riskAwareness: number;
  professionalJudgment: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  concerns: string[];
}

export async function runEvaluationAgent(
  job: Job,
  conversationHistory: Message[]
): Promise<EvaluationResult> {
  const transcript = conversationHistory
    .map(m => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = `You are an expert hiring evaluator. Analyze the following interview transcript for the role: "${job.title}".

Job Description: ${job.description}
Simulation Type: ${job.simulationType}
Seniority Level: ${job.seniorityLevel}

Evaluate the candidate on these dimensions (score each 0-100):
1. Decision Quality - How sound were the candidate's decisions in the scenarios?
2. Communication Clarity - How clearly did the candidate express ideas?
3. Structured Process - Did the candidate use a structured approach to problem-solving?
4. Risk Awareness - Did the candidate identify and address risks appropriately?
5. Professional Judgment - Did the candidate demonstrate appropriate professional standards?

Also calculate an overall score (weighted average of above).

Provide a recommendation: "strong_hire", "hire", "maybe", "no_hire", or "strong_no_hire"

You MUST respond with valid JSON in this exact format:
{
  "overallScore": <number 0-100>,
  "decisionQuality": <number 0-100>,
  "communicationClarity": <number 0-100>,
  "structuredProcess": <number 0-100>,
  "riskAwareness": <number 0-100>,
  "professionalJudgment": <number 0-100>,
  "recommendation": "<strong_hire|hire|maybe|no_hire|strong_no_hire>",
  "summary": "<2-3 paragraph evaluation summary>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Interview Transcript:\n\n${transcript}` },
      ],
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content) as EvaluationResult;

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v || 0)));
    parsed.overallScore = clamp(parsed.overallScore);
    parsed.decisionQuality = clamp(parsed.decisionQuality);
    parsed.communicationClarity = clamp(parsed.communicationClarity);
    parsed.structuredProcess = clamp(parsed.structuredProcess);
    parsed.riskAwareness = clamp(parsed.riskAwareness);
    parsed.professionalJudgment = clamp(parsed.professionalJudgment);

    if (!parsed.recommendation) parsed.recommendation = "maybe";
    if (!parsed.summary) parsed.summary = "Evaluation completed.";
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.concerns)) parsed.concerns = [];

    return parsed;
  } catch (error) {
    console.error("Evaluation agent error:", error);
    return {
      overallScore: 50,
      decisionQuality: 50,
      communicationClarity: 50,
      structuredProcess: 50,
      riskAwareness: 50,
      professionalJudgment: 50,
      recommendation: "maybe",
      summary: "The evaluation could not be fully completed due to a processing error. A manual review is recommended.",
      strengths: ["Completed the interview simulation"],
      concerns: ["Automated evaluation encountered an error"],
    };
  }
}
