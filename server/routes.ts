import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { runInterviewAgent } from "./services/interviewAgent";
import { runEvaluationAgent } from "./services/evaluationAgent";

function param(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post("/api/jobs", requireAuth, async (req: Request, res: Response) => {
    try {
      const jobToken = randomBytes(12).toString("hex");
      const jobData = {
        ...req.body,
        ownerId: req.user!.id,
        jobToken,
      };
      const parsed = insertJobSchema.parse(jobData);
      const job = await storage.createJob(parsed);
      return res.status(201).json(job);
    } catch (error: any) {
      console.error("Create job error:", error);
      return res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.get("/api/jobs", requireAuth, async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getJobsByOwner(req.user!.id);
      return res.json(jobs);
    } catch (error) {
      console.error("Get jobs error:", error);
      return res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:jobId", requireAuth, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(param(req.params.jobId));
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.ownerId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
      return res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      return res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/jobs/:jobId/applications", requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = param(req.params.jobId);
      const job = await storage.getJob(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.ownerId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
      const apps = await storage.getApplicationsByJob(jobId);

      const appsWithEvals = await Promise.all(
        apps.map(async (app) => {
          const evaluation = await storage.getEvaluationByApplication(app.id);
          return { ...app, evaluation: evaluation || null };
        })
      );

      return res.json(appsWithEvals);
    } catch (error) {
      console.error("Get applications error:", error);
      return res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:appId/report", requireAuth, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(param(req.params.appId));
      if (!application) return res.status(404).json({ message: "Application not found" });

      const job = await storage.getJob(application.jobId);
      if (!job || job.ownerId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

      const [evaluation, flagsList, messagesList] = await Promise.all([
        storage.getEvaluationByApplication(application.id),
        storage.getFlagsByApplication(application.id),
        storage.getMessagesByApplication(application.id),
      ]);

      return res.json({
        application,
        job,
        evaluation: evaluation || null,
        flags: flagsList,
        messages: messagesList,
      });
    } catch (error) {
      console.error("Get report error:", error);
      return res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.patch("/api/applications/:appId/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const appId = param(req.params.appId);
      const application = await storage.getApplication(appId);
      if (!application) return res.status(404).json({ message: "Application not found" });

      const job = await storage.getJob(application.jobId);
      if (!job || job.ownerId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

      const { status } = req.body;
      if (!status) return res.status(400).json({ message: "Status is required" });

      const updated = await storage.updateApplicationStatus(appId, status);
      return res.json(updated);
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/public/job/:jobToken", async (req: Request, res: Response) => {
    try {
      const job = await storage.getJobByToken(param(req.params.jobToken));
      if (!job || !job.isActive) return res.status(404).json({ message: "Job not found or inactive" });
      const { ownerId, scoringWeights, ...publicJob } = job;
      return res.json(publicJob);
    } catch (error) {
      console.error("Get public job error:", error);
      return res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/public/applications", async (req: Request, res: Response) => {
    try {
      const { jobToken, ...candidateData } = req.body;
      const job = await storage.getJobByToken(jobToken);
      if (!job || !job.isActive) return res.status(404).json({ message: "Job not found or inactive" });

      const appData = {
        ...candidateData,
        jobId: job.id,
        status: "in_progress",
      };

      const parsed = insertApplicationSchema.parse(appData);
      const application = await storage.createApplication(parsed);
      return res.status(201).json(application);
    } catch (error: any) {
      console.error("Create application error:", error);
      return res.status(400).json({ message: error.message || "Failed to create application" });
    }
  });

  app.get("/api/public/applications/:appId/messages", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(param(req.params.appId));
      if (!application) return res.status(404).json({ message: "Application not found" });
      const msgs = await storage.getMessagesByApplication(application.id);
      return res.json(msgs);
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/public/applications/:appId/message", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(param(req.params.appId));
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.status === "submitted" || application.status === "evaluated") {
        return res.status(400).json({ message: "Interview already submitted" });
      }

      const job = await storage.getJob(application.jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });

      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Message content is required" });

      await storage.createMessage({
        applicationId: application.id,
        role: "user",
        content,
      });

      const conversationHistory = await storage.getMessagesByApplication(application.id);

      const aiResponse = await runInterviewAgent(job, conversationHistory, content);

      const assistantMessage = await storage.createMessage({
        applicationId: application.id,
        role: "assistant",
        content: aiResponse.assistant_message,
      });

      for (const flag of aiResponse.detected_flags) {
        await storage.createFlag({
          applicationId: application.id,
          severity: flag.severity,
          category: flag.category,
          excerpt: flag.excerpt,
        });
      }

      return res.json({
        message: assistantMessage,
        stage: aiResponse.stage,
      });
    } catch (error) {
      console.error("Send message error:", error);
      return res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.post("/api/public/applications/:appId/submit", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(param(req.params.appId));
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.status === "submitted" || application.status === "evaluated") {
        return res.status(400).json({ message: "Interview already submitted" });
      }

      const job = await storage.getJob(application.jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });

      await storage.submitApplication(application.id);

      const conversationHistory = await storage.getMessagesByApplication(application.id);

      if (conversationHistory.length > 0) {
        try {
          const evalResult = await runEvaluationAgent(job, conversationHistory);

          await storage.createEvaluation({
            applicationId: application.id,
            overallScore: evalResult.overallScore,
            decisionQuality: evalResult.decisionQuality,
            communicationClarity: evalResult.communicationClarity,
            structuredProcess: evalResult.structuredProcess,
            riskAwareness: evalResult.riskAwareness,
            professionalJudgment: evalResult.professionalJudgment,
            recommendation: evalResult.recommendation,
            summary: evalResult.summary,
            strengths: evalResult.strengths,
            concerns: evalResult.concerns,
          });

          await storage.updateApplicationStatus(application.id, "evaluated");
        } catch (evalError) {
          console.error("Evaluation error:", evalError);
        }
      }

      return res.json({ message: "Interview submitted successfully" });
    } catch (error) {
      console.error("Submit application error:", error);
      return res.status(500).json({ message: "Failed to submit interview" });
    }
  });

  return httpServer;
}
