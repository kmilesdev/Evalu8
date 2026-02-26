import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Check, ExternalLink } from "lucide-react";

const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  simulationType: z.string().min(1, "Simulation type is required"),
  seniorityLevel: z.string().min(1, "Seniority level is required"),
  timeLimitMinutes: z.coerce.number().min(5).max(120),
  numQuestions: z.coerce.number().min(1).max(20),
});

type CreateJobFormValues = z.infer<typeof createJobSchema>;

const simulationTypes = [
  { value: "crisis_management", label: "Crisis Management" },
  { value: "client_negotiation", label: "Client Negotiation" },
  { value: "technical_decision", label: "Technical Decision Making" },
  { value: "team_conflict", label: "Team Conflict Resolution" },
  { value: "budget_planning", label: "Budget Planning" },
  { value: "product_launch", label: "Product Launch" },
  { value: "strategic_planning", label: "Strategic Planning" },
  { value: "general", label: "General Assessment" },
];

const seniorityLevels = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c_level", label: "C-Level" },
];

export default function CreateJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      simulationType: "",
      seniorityLevel: "",
      timeLimitMinutes: 30,
      numQuestions: 5,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateJobFormValues) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return (await res.json()) as Job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreatedJob(job);
      toast({
        title: "Job created successfully",
        description: "Share the link with candidates to begin evaluations.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create job",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CreateJobFormValues) {
    createMutation.mutate(data);
  }

  function getShareableLink(jobToken: string) {
    return `${window.location.origin}/apply/${jobToken}`;
  }

  async function copyLink() {
    if (!createdJob) return;
    await navigator.clipboard.writeText(getShareableLink(createdJob.jobToken));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdJob) {
    const link = getShareableLink(createdJob.jobToken);
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card data-testid="card-job-created">
          <CardHeader>
            <CardTitle className="text-xl" data-testid="text-job-created-title">Job Created</CardTitle>
            <CardDescription>
              Your job simulation "{createdJob.title}" has been created. Share the link below with candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={link}
                className="font-mono text-sm"
                data-testid="input-shareable-link"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={() => setLocation(`/jobs/${createdJob.id}`)} data-testid="button-view-job">
                <ExternalLink className="w-4 h-4" />
                View Job
              </Button>
              <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-create-job-title">Create Job Simulation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set up a new simulation to evaluate candidates with AI-powered interviews.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Product Manager" {...field} data-testid="input-job-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and what you're looking for..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-job-description"
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used by the AI to tailor the interview simulation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="simulationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Simulation Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-simulation-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {simulationTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value} data-testid={`option-simulation-${t.value}`}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seniorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-seniority-level">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {seniorityLevels.map((l) => (
                            <SelectItem key={l.value} value={l.value} data-testid={`option-seniority-${l.value}`}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeLimitMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={5} max={120} {...field} data-testid="input-time-limit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={20} {...field} data-testid="input-num-questions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-job">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Job
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
