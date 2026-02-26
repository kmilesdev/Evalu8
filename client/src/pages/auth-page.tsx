import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight cursor-pointer" data-testid="link-auth-brand">
              Evalu<span className="text-primary">8</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            AI-Powered Hiring Simulations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your recruiter account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1" data-testid="tab-login">
                  Log In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1" data-testid="tab-register">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <AuthForm
                  mode="login"
                  isPending={isPending}
                  onSubmit={async (data) => {
                    setIsPending(true);
                    try {
                      await login(data);
                    } catch (err: any) {
                      toast({
                        variant: "destructive",
                        title: "Login failed",
                        description: err.message || "Invalid credentials",
                      });
                    } finally {
                      setIsPending(false);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="register">
                <AuthForm
                  mode="register"
                  isPending={isPending}
                  onSubmit={async (data) => {
                    setIsPending(true);
                    try {
                      await register(data);
                      toast({
                        title: "Account created",
                        description: "Welcome to Evalu8!",
                      });
                    } catch (err: any) {
                      toast({
                        variant: "destructive",
                        title: "Registration failed",
                        description: err.message || "Could not create account",
                      });
                    } finally {
                      setIsPending(false);
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuthForm({
  mode,
  isPending,
  onSubmit,
}: {
  mode: "login" | "register";
  isPending: boolean;
  onSubmit: (data: AuthFormValues) => Promise<void>;
}) {
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your username"
                  data-testid="input-username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  data-testid="input-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid={`button-${mode}`}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Log In" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
