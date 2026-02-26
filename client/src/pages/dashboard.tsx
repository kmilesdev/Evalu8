import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Job } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, PlusCircle, Users, Clock, ChevronRight, AlertCircle } from "lucide-react";

type JobWithCounts = Job & { applicationCount?: number };

function formatDate(date: string | Date | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function JobCard({ job }: { job: JobWithCounts }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-job-${job.id}`}>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate" data-testid={`text-job-title-${job.id}`}>
              {job.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {job.description}
            </CardDescription>
          </div>
          <Badge
            variant={job.isActive ? "default" : "secondary"}
            className="shrink-0"
            data-testid={`badge-job-status-${job.id}`}
          >
            {job.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{job.simulationType}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{job.seniorityLevel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{job.timeLimitMinutes}m</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t text-sm">
            <span className="text-muted-foreground">
              Created {formatDate(job.createdAt)}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3 mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your job simulations and review candidates.
          </p>
        </div>
        <Link href="/jobs/new">
          <Button data-testid="button-create-job">
            <PlusCircle className="w-4 h-4" />
            Create Job
          </Button>
        </Link>
      </div>

      {isLoading && <DashboardSkeleton />}

      {error && (
        <Card data-testid="text-dashboard-error">
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load jobs. Please try again.</span>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && jobs && jobs.length === 0 && (
        <Card data-testid="text-dashboard-empty">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-1">No jobs yet</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              Create your first job simulation to start evaluating candidates with AI-powered interviews.
            </p>
            <Link href="/jobs/new">
              <Button data-testid="button-create-first-job">
                <PlusCircle className="w-4 h-4" />
                Create Your First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && jobs && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="grid-jobs">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
