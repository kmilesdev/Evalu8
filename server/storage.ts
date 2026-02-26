import {
  type User, type InsertUser,
  type Job, type InsertJob,
  type Application, type InsertApplication,
  type Message, type InsertMessage,
  type Evaluation, type InsertEvaluation,
  type Flag, type InsertFlag,
  users, jobs, applications, messages, evaluations, flags,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobByToken(token: string): Promise<Job | undefined>;
  getJobsByOwner(ownerId: string): Promise<Job[]>;

  createApplication(app: InsertApplication): Promise<Application>;
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;
  submitApplication(id: string): Promise<Application | undefined>;

  createMessage(msg: InsertMessage): Promise<Message>;
  getMessagesByApplication(applicationId: string): Promise<Message[]>;

  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationByApplication(applicationId: string): Promise<Evaluation | undefined>;

  createFlag(flag: InsertFlag): Promise<Flag>;
  getFlagsByApplication(applicationId: string): Promise<Flag[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobByToken(token: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.jobToken, token));
    return job;
  }

  async getJobsByOwner(ownerId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.ownerId, ownerId)).orderBy(desc(jobs.createdAt));
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values({ ...app, status: "in_progress" }).returning();
    return created;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.startedAt));
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set({ status }).where(eq(applications.id, id)).returning();
    return updated;
  }

  async submitApplication(id: string): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set({ status: "submitted", submittedAt: new Date() }).where(eq(applications.id, id)).returning();
    return updated;
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async getMessagesByApplication(applicationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.applicationId, applicationId)).orderBy(messages.createdAt);
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [created] = await db.insert(evaluations).values(evaluation).returning();
    return created;
  }

  async getEvaluationByApplication(applicationId: string): Promise<Evaluation | undefined> {
    const [eval_] = await db.select().from(evaluations).where(eq(evaluations.applicationId, applicationId));
    return eval_;
  }

  async createFlag(flag: InsertFlag): Promise<Flag> {
    const [created] = await db.insert(flags).values(flag).returning();
    return created;
  }

  async getFlagsByApplication(applicationId: string): Promise<Flag[]> {
    return db.select().from(flags).where(eq(flags.applicationId, applicationId)).orderBy(flags.createdAt);
  }
}

export const storage = new DatabaseStorage();
