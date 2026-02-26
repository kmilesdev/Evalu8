import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CreateJob from "@/pages/create-job";
import JobDetail from "@/pages/job-detail";
import CandidateReport from "@/pages/candidate-report";
import ApplyPage from "@/pages/apply";
import InterviewPage from "@/pages/interview";
import InterviewCompletePage from "@/pages/interview-complete";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element | null }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

function RecruiterLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-2 p-2 border-b sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/dashboard">
                <ProtectedRoute component={Dashboard} />
              </Route>
              <Route path="/jobs/new">
                <ProtectedRoute component={CreateJob} />
              </Route>
              <Route path="/jobs/:jobId">
                <ProtectedRoute component={JobDetail} />
              </Route>
              <Route path="/applications/:appId/report">
                <ProtectedRoute component={CandidateReport} />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const [location] = useLocation();

  const publicPaths = ["/", "/auth"];
  const isPublicPath = publicPaths.includes(location) ||
    location.startsWith("/apply/") ||
    location.startsWith("/interview/") ||
    location.startsWith("/interview-complete");

  if (isPublicPath) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/apply/:jobToken" component={ApplyPage} />
        <Route path="/interview/:appId" component={InterviewPage} />
        <Route path="/interview-complete/:appId" component={InterviewCompletePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return <RecruiterLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRouter />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
