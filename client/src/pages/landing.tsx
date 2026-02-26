import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  Brain,
  BarChart3,
  Shield,
  Zap,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <Link href="/">
            <span
              className="text-xl font-bold tracking-tight cursor-pointer"
              data-testid="link-brand"
            >
              Evalu<span className="text-primary">8</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {user ? (
              <Link href="/dashboard">
                <Button data-testid="button-go-dashboard">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" data-testid="button-login">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button data-testid="button-get-started">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-chart-2/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>AI-Powered Hiring Simulations</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6"
            data-testid="text-hero-title"
          >
            Simulate real work
            <br />
            <span className="text-primary">before the first interview</span>
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            data-testid="text-hero-subtitle"
          >
            Evalu8 uses AI-driven workplace simulations to evaluate candidate
            decision-making, communication, and professional judgment — so you
            hire smarter, faster.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/auth">
              <Button size="lg" data-testid="button-hero-cta">
                Start Evaluating
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" data-testid="button-hero-learn">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2
            className="text-3xl font-bold tracking-tight mb-3"
            data-testid="text-features-title"
          >
            How Evalu8 Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to better hiring decisions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: "Create Simulations",
              desc: "Design realistic workplace scenarios tailored to your role. Set seniority, question count, and scoring weights.",
            },
            {
              icon: Users,
              title: "Share with Candidates",
              desc: "Generate a unique link for each job. Candidates complete the AI-driven interview at their own pace.",
            },
            {
              icon: BarChart3,
              title: "Review AI Reports",
              desc: "Get detailed evaluation reports with scores across decision quality, communication, risk awareness, and more.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold tracking-tight mb-3"
              data-testid="text-why-title"
            >
              Why Evalu8?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Traditional interviews miss what matters most
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Reduce Bias",
                desc: "Standardized AI-driven simulations ensure every candidate is evaluated fairly.",
              },
              {
                icon: Clock,
                title: "Save Time",
                desc: "Screen candidates before live interviews. Focus your time on the best fits.",
              },
              {
                icon: CheckCircle2,
                title: "Better Signal",
                desc: "Measure real decision-making skills, not just interview performance.",
              },
              {
                icon: Zap,
                title: "Fast Setup",
                desc: "Create a simulation in minutes. Share a link and start receiving evaluations.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2
          className="text-3xl font-bold tracking-tight mb-3"
          data-testid="text-cta-title"
        >
          Ready to hire smarter?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Start creating AI-powered hiring simulations today. No credit card
          required.
        </p>
        <Link href="/auth">
          <Button size="lg" data-testid="button-cta-bottom">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm text-muted-foreground" data-testid="text-footer">
            Evalu8 &mdash; AI-Powered Hiring Simulations
          </span>
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
