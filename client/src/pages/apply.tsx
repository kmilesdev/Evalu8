import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, Clock, MessageSquare, AlertTriangle } from "lucide-react";
import type { Job } from "@shared/schema";

const intakeSchema = z.object({
  candidateName: z.string().min(1, "Name is required"),
  candidateEmail: z.string().email("Valid email is required"),
  location: z.string().min(1, "Location is required"),
  workAuth: z.string().min(1, "Work authorization is required"),
  availabilityDate: z.string().min(1, "Availability date is required"),
  yearsExperience: z.coerce.number().min(0, "Must be 0 or more"),
  desiredComp: z.string().min(1, "Desired compensation is required"),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export default function ApplyPage() {
  const { jobToken } = useParams<{ jobToken: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: ["/api/public/job", jobToken],
  });

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      location: "",
      workAuth: "",
      availabilityDate: "",
      yearsExperience: 0,
      desiredComp: "",
    },
  });

  const handleSubmit = async (data: IntakeFormValues) => {
    setIsPending(true);
    try {
      const res = await apiRequest("POST", "/api/public/applications", {
        ...data,
        jobToken,
      });
      const application = await res.json();
      setLocation(`/interview/${application.id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err.message || "Could not start the simulation",
      });
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-destructive/10 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-job-not-found">
              Job Not Found
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This job simulation link is invalid or the position is no longer active.
            </p>
            <Link href="/">
              <Button variant="outline" data-testid="button-go-home">
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-6 py-3">
          <Link href="/">
            <span className="text-xl font-bold tracking-tight cursor-pointer" data-testid="link-apply-brand">
              Evalu<span className="text-primary">8</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2" data-testid="text-apply-title">
            {job.title}
          </h1>
          <p className="text-muted-foreground mb-4" data-testid="text-apply-description">
            {job.description}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.simulationType}
            </Badge>
            <Badge variant="secondary">
              {job.seniorityLevel}
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {job.timeLimitMinutes} min
            </Badge>
            <Badge variant="outline">
              <MessageSquare className="w-3 h-3 mr-1" />
              {job.numQuestions} questions
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="text-intake-title">
              Candidate Information
            </CardTitle>
            <CardDescription>
              Fill in your details below to begin the simulation interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="candidateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Smith"
                            data-testid="input-candidate-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="candidateEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="jane@example.com"
                            data-testid="input-candidate-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="San Francisco, CA"
                            data-testid="input-location"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workAuth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Authorization</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-work-auth">
                              <SelectValue placeholder="Select authorization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="us_citizen">US Citizen</SelectItem>
                            <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                            <SelectItem value="work_visa">Work Visa</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                  <FormField
                    control={form.control}
                    name="availabilityDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-availability"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="5"
                            data-testid="input-years-experience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="desiredComp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Compensation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="$120,000"
                            data-testid="input-desired-comp"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                    data-testid="button-start-simulation"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Begin Simulation
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
