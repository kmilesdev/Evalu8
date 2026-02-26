import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Job, Application, Evaluation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Clock,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

type ApplicationWithEval = Application & { evaluation: Evaluation | null };

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "evaluated":
      return "default";
    case "submitted":
      return "secondary";
    case "in_progress":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: string | Date | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-muted-foreground">--</span>;
  const rounded = Math.round(score);
  return (
    <span className="font-semibold tabular-nums" data-testid="text-score">
      {rounded}/100
    </span>
  );
}

export default function JobDetail() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
  });

  const { data: applications, isLoading: appsLoading } = useQuery<ApplicationWithEval[]>({
    queryKey: ["/api/jobs", jobId, "applications"],
    enabled: !!job,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      await apiRequest("PATCH", `/api/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "applications"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });

  async function copyLink() {
    if (!job) return;
    const link = `${window.location.origin}/apply/${job.jobToken}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (jobLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Card>
          <CardContent className="py-8">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card data-testid="text-job-error">
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load job details.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-3" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-job-title">{job.title}</h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">{job.description}</p>
          </div>
          <Badge variant={job.isActive ? "default" : "secondary"} data-testid="badge-job-active">
            {job.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{job.simulationType.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{job.seniorityLevel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{job.timeLimitMinutes} min, {job.numQuestions} questions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={copyLink} data-testid="button-copy-job-link">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Invite Link"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Candidates</CardTitle>
            <CardDescription>
              {applications ? `${applications.length} candidate${applications.length !== 1 ? "s" : ""}` : "Loading..."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {appsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!appsLoading && applications && applications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="text-no-candidates">
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No candidates yet. Share the invite link to get started.
              </p>
            </div>
          )}

          {!appsLoading && applications && applications.length > 0 && (
            <Table data-testid="table-candidates">
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} data-testid={`row-candidate-${app.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-candidate-name-${app.id}`}>
                          {app.candidateName}
                        </div>
                        <div className="text-sm text-muted-foreground">{app.candidateEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(app.status)} data-testid={`badge-status-${app.id}`}>
                        {statusLabel(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={app.evaluation?.overallScore ?? null} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(app.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.evaluation && (
                          <Link href={`/applications/${app.id}/report`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-report-${app.id}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                              Report
                            </Button>
                          </Link>
                        )}
                        {(app.status === "evaluated" || app.status === "submitted") && (
                          <Select
                            value={app.status}
                            onValueChange={(val) => statusMutation.mutate({ appId: app.id, status: val })}
                          >
                            <SelectTrigger className="w-[130px]" data-testid={`select-status-${app.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="evaluated">Evaluated</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
