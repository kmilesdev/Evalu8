import OpenAI from "openai";
import type { Job, Message } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface InterviewResponse {
  assistant_message: string;
  detected_flags: Array<{
    severity: string;
    category: string;
    excerpt: string;
  }>;
  stage: "introduction" | "questioning" | "follow_up" | "closing";
}

export async function runInterviewAgent(
  job: Job,
  conversationHistory: Message[],
  candidateMessage: string
): Promise<InterviewResponse> {
  const questionCount = conversationHistory.filter(m => m.role === "assistant").length;
  const maxQuestions = job.numQuestions || 8;
  const simulationType = job.simulationType || "problem_solving";
  const seniorityLevel = job.seniorityLevel || "mid";
  const timeLimitMinutes = job.timeLimitMinutes || 15;

  const systemPrompt = `You are an AI interviewer conducting a workplace simulation interview for the role: "${job.title}".

Job Description: ${job.description}
Simulation Type: ${simulationType}
Seniority Level: ${seniorityLevel}
Time Limit: ${timeLimitMinutes} minutes
Maximum Questions: ${maxQuestions}
Questions Asked So Far: ${questionCount}

Your role is to simulate real workplace scenarios and evaluate the candidate's decision-making abilities. Follow these rules:
1. Ask ONE question at a time based on realistic workplace scenarios relevant to this role
2. Adapt your follow-up questions based on the candidate's responses
3. Watch for red flags: inconsistencies, evasiveness, lack of depth, unprofessional responses, poor judgment
4. Be professional but probing - dig deeper when answers are vague
5. If this is the first message (no prior conversation), introduce the simulation scenario and ask the first question
6. If you've asked ${maxQuestions} or more questions, wrap up the interview gracefully

Determine the current stage:
- "introduction" if this is the first interaction
- "questioning" if actively asking scenario questions
- "follow_up" if probing deeper on a previous answer
- "closing" if wrapping up (${questionCount} >= ${maxQuestions - 1})

You MUST respond with valid JSON in this exact format:
{
  "assistant_message": "Your message to the candidate",
  "detected_flags": [{"severity": "low|medium|high", "category": "category name", "excerpt": "relevant quote or observation"}],
  "stage": "introduction|questioning|follow_up|closing"
}

If no flags are detected, return an empty array for detected_flags.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: candidateMessage });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content) as InterviewResponse;

    if (!parsed.assistant_message) {
      parsed.assistant_message = "Could you elaborate on that?";
    }
    if (!Array.isArray(parsed.detected_flags)) {
      parsed.detected_flags = [];
    }
    if (!["introduction", "questioning", "follow_up", "closing"].includes(parsed.stage)) {
      parsed.stage = "questioning";
    }

    return parsed;
  } catch (error) {
    console.error("Interview agent error:", error);
    return {
      assistant_message: "Thank you for your response. Could you tell me more about how you would handle a challenging situation in this role?",
      detected_flags: [],
      stage: "questioning",
    };
  }
}
