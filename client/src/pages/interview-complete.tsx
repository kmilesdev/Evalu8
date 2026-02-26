import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function InterviewCompletePage() {
  const { appId } = useParams<{ appId: string }>();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-6 py-3">
          <Link href="/">
            <span className="text-xl font-bold tracking-tight cursor-pointer" data-testid="link-complete-brand">
              Evalu<span className="text-primary">8</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center px-6 py-20">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <h1
              className="text-2xl font-bold tracking-tight mb-3"
              data-testid="text-complete-title"
            >
              Interview Submitted
            </h1>

            <p
              className="text-muted-foreground mb-2 max-w-sm mx-auto"
              data-testid="text-complete-description"
            >
              Thank you for completing the simulation interview. Your responses
              have been submitted and are being evaluated by our AI system.
            </p>

            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              The hiring team will review your evaluation report and reach out
              if there is a match. No further action is needed from you at this
              time.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/">
                <Button variant="outline" data-testid="button-back-home">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
