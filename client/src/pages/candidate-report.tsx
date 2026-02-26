import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Application, Job, Evaluation, Flag, Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  User,
  Bot,
  Printer,
  Download,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

type ReportData = {
  application: Application;
  job: Job;
  evaluation: Evaluation | null;
  flags: Flag[];
  messages: Message[];
};

function recommendationBadge(recommendation: string) {
  const lower = recommendation.toLowerCase();
  if (lower.includes("strong") && lower.includes("yes")) {
    return <Badge data-testid="badge-recommendation">Strong Yes</Badge>;
  }
  if (lower.includes("yes")) {
    return <Badge data-testid="badge-recommendation">Yes</Badge>;
  }
  if (lower.includes("no") && lower.includes("strong")) {
    return <Badge variant="destructive" data-testid="badge-recommendation">Strong No</Badge>;
  }
  if (lower.includes("no")) {
    return <Badge variant="destructive" data-testid="badge-recommendation">No</Badge>;
  }
  return <Badge variant="secondary" data-testid="badge-recommendation">{recommendation}</Badge>;
}

function severityIcon(severity: string) {
  switch (severity.toLowerCase()) {
    case "high":
    case "critical":
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4 text-chart-4 shrink-0" />;
    default:
      return <MinusCircle className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}

function OverallScoreChart({ score }: { score: number }) {
  const data = [{ name: "Score", value: score, fill: "hsl(var(--primary))" }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: "hsl(var(--muted))" }}
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" data-testid="text-overall-score">
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
    </div>
  );
}

function DimensionScoresChart({ evaluation }: { evaluation: Evaluation }) {
  const dimensions = [
    { name: "Decision Quality", value: evaluation.decisionQuality },
    { name: "Communication", value: evaluation.communicationClarity },
    { name: "Structured Process", value: evaluation.structuredProcess },
    { name: "Risk Awareness", value: evaluation.riskAwareness },
    { name: "Professional Judgment", value: evaluation.professionalJudgment },
  ];

  function getBarColor(value: number) {
    if (value >= 70) return "hsl(var(--chart-3))";
    if (value >= 40) return "hsl(var(--chart-4))";
    return "hsl(var(--destructive))";
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dimensions} layout="vertical" margin={{ left: 120, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          width={110}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
          {dimensions.map((d, i) => (
            <Cell key={i} fill={getBarColor(d.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TranscriptSection({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Interview Transcript</CardTitle>
        <CardDescription>{messages.length} messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "assistant" ? "" : ""}`}
              data-testid={`message-${msg.id}`}
            >
              <div className="shrink-0 mt-0.5">
                {msg.role === "assistant" ? (
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {msg.role === "assistant" ? "AI Interviewer" : "Candidate"}
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function generateReportText(
  application: Application,
  job: Job,
  evaluation: Evaluation,
  flags: Flag[],
  msgs: Message[]
): string {
  const lines: string[] = [];
  lines.push("EVALU8 - CANDIDATE EVALUATION REPORT");
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Candidate: ${application.candidateName}`);
  lines.push(`Email: ${application.candidateEmail}`);
  lines.push(`Position: ${job.title}`);
  lines.push(`Simulation: ${job.simulationType.replace(/_/g, " ")}`);
  lines.push(`Seniority: ${job.seniorityLevel}`);
  lines.push("");
  lines.push("-".repeat(50));
  lines.push("SCORES");
  lines.push("-".repeat(50));
  lines.push(`Overall Score: ${Math.round(evaluation.overallScore)} / 100`);
  lines.push(`Recommendation: ${evaluation.recommendation}`);
  lines.push(`Decision Quality: ${Math.round(evaluation.decisionQuality)}`);
  lines.push(`Communication Clarity: ${Math.round(evaluation.communicationClarity)}`);
  lines.push(`Structured Process: ${Math.round(evaluation.structuredProcess)}`);
  lines.push(`Risk Awareness: ${Math.round(evaluation.riskAwareness)}`);
  lines.push(`Professional Judgment: ${Math.round(evaluation.professionalJudgment)}`);
  lines.push("");
  lines.push("-".repeat(50));
  lines.push("SUMMARY");
  lines.push("-".repeat(50));
  lines.push(evaluation.summary);
  lines.push("");
  if (evaluation.strengths.length > 0) {
    lines.push("STRENGTHS:");
    evaluation.strengths.forEach((s) => lines.push(`  + ${s}`));
    lines.push("");
  }
  if (evaluation.concerns.length > 0) {
    lines.push("CONCERNS:");
    evaluation.concerns.forEach((c) => lines.push(`  - ${c}`));
    lines.push("");
  }
  if (flags.length > 0) {
    lines.push("-".repeat(50));
    lines.push("RED FLAGS");
    lines.push("-".repeat(50));
    flags.forEach((f) => {
      lines.push(`[${f.severity.toUpperCase()}] ${f.category}: ${f.excerpt}`);
    });
    lines.push("");
  }
  if (application.location || application.yearsExperience || application.desiredComp) {
    lines.push("-".repeat(50));
    lines.push("CANDIDATE DETAILS");
    lines.push("-".repeat(50));
    if (application.location) lines.push(`Location: ${application.location}`);
    if (application.workAuth) lines.push(`Work Authorization: ${application.workAuth}`);
    if (application.yearsExperience) lines.push(`Experience: ${application.yearsExperience} years`);
    if (application.desiredComp) lines.push(`Desired Compensation: ${application.desiredComp}`);
    lines.push("");
  }
  lines.push("-".repeat(50));
  lines.push("INTERVIEW TRANSCRIPT");
  lines.push("-".repeat(50));
  msgs.forEach((msg) => {
    const speaker = msg.role === "assistant" ? "AI Interviewer" : "Candidate";
    lines.push(`[${speaker}]`);
    lines.push(msg.content);
    lines.push("");
  });
  return lines.join("\n");
}

export default function CandidateReport() {
  const params = useParams<{ appId: string }>();
  const appId = params.appId;

  const { data, isLoading, error } = useQuery<ReportData>({
    queryKey: ["/api/applications", appId, "report"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-8">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-8">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card data-testid="text-report-error">
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load report.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, job, evaluation, flags, messages } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <Link href={`/jobs/${job.id}`}>
          <Button variant="ghost" size="sm" data-testid="button-back-job">
            <ArrowLeft className="w-4 h-4" />
            Back to {job.title}
          </Button>
        </Link>
        {evaluation && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = generateReportText(application, job, evaluation, flags, messages);
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${application.candidateName.replace(/\s/g, "_")}_report.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              data-testid="button-export-report"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              data-testid="button-print-report"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-candidate-name">
            {application.candidateName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {application.candidateEmail} &middot; {job.title}
          </p>
        </div>
        {evaluation && recommendationBadge(evaluation.recommendation)}
      </div>

      {!evaluation && (
        <Card data-testid="text-no-evaluation">
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>Evaluation not yet available for this candidate.</span>
          </CardContent>
        </Card>
      )}

      {evaluation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-overall-score">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <OverallScoreChart score={evaluation.overallScore} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2" data-testid="card-dimension-scores">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dimension Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <DimensionScoresChart evaluation={evaluation} />
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-summary">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed" data-testid="text-summary">
                {evaluation.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-strengths">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-3" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.strengths.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No strengths identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-strength-${i}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-chart-3 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-concerns">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-chart-4" />
                  Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.concerns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No concerns identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {evaluation.concerns.map((c, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-concern-${i}`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-chart-4 mt-0.5 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {flags.length > 0 && (
            <Card data-testid="card-flags">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Red Flags ({flags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {flags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-start gap-3 text-sm"
                      data-testid={`flag-${flag.id}`}
                    >
                      {severityIcon(flag.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {flag.severity}
                          </Badge>
                          <span className="text-muted-foreground text-xs">{flag.category}</span>
                        </div>
                        <p className="mt-1 text-sm">{flag.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Location", value: application.location },
              { label: "Work Auth", value: application.workAuth },
              { label: "Experience", value: application.yearsExperience ? `${application.yearsExperience} years` : null },
              { label: "Desired Comp", value: application.desiredComp },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-medium" data-testid={`text-detail-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {item.value || "N/A"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <TranscriptSection messages={messages} />
        </div>
      )}
    </div>
  );
}
