import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Clock,
  MessageSquare,
  CheckCircle2,
  Bot,
  User,
} from "lucide-react";
import type { Message } from "@shared/schema";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
};

export default function InterviewPage() {
  const { appId } = useParams<{ appId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState("intro");
  const [questionCount, setQuestionCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [timeLimitMs, setTimeLimitMs] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [numQuestions, setNumQuestions] = useState(8);

  const { data: messagesData, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/public/applications", appId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/public/applications/${appId}/messages`, {
        credentials: "include",
      });
      if (res.status === 404) return [];
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      setMessages(
        messagesData.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
      const assistantCount = messagesData.filter((m) => m.role === "assistant").length;
      setQuestionCount(assistantCount);
    }
  }, [messagesData]);

  useEffect(() => {
    if (messages.length === 0 && !messagesLoading) {
      sendInitialMessage();
    }
  }, [messagesLoading]);

  useEffect(() => {
    if (timeLimitMs === null) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLimitMs, startTime]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendInitialMessage() {
    setIsSending(true);
    try {
      const res = await apiRequest("POST", `/api/public/applications/${appId}/message`, {
        content: "Hello, I'm ready to begin the simulation.",
      });
      const data = await res.json();
      setMessages([
        {
          id: "user-init",
          role: "user",
          content: "Hello, I'm ready to begin the simulation.",
        },
        {
          id: data.message.id,
          role: "assistant",
          content: data.message.content,
        },
      ]);
      if (data.stage) setStage(data.stage);
      if (data.numQuestions) setNumQuestions(data.numQuestions);
      if (data.timeLimitMinutes) setTimeLimitMs(data.timeLimitMinutes * 60 * 1000);
      setQuestionCount(1);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "Could not start the interview. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput("");

    const tempId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage },
    ]);

    setIsSending(true);
    try {
      const res = await apiRequest("POST", `/api/public/applications/${appId}/message`, {
        content: userMessage,
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: "assistant",
          content: data.message.content,
        },
      ]);
      if (data.stage) setStage(data.stage);
      if (data.numQuestions) setNumQuestions(data.numQuestions);
      setQuestionCount((prev) => prev + 1);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send message",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmitInterview() {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/public/applications/${appId}/submit`);
      setLocation(`/interview-complete/${appId}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err.message || "Could not submit interview",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/">
              <span className="text-lg font-bold tracking-tight cursor-pointer" data-testid="link-interview-brand">
                Evalu<span className="text-primary">8</span>
              </span>
            </Link>
            <Badge variant="outline" data-testid="badge-interview-status">
              <MessageSquare className="w-3 h-3 mr-1" />
              Interview
            </Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {timeRemaining !== null && (
              <Badge
                variant={timeRemaining < 60000 ? "destructive" : "secondary"}
                data-testid="badge-timer"
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmitInterview}
              disabled={isSubmitting || messages.length < 2}
              data-testid="button-submit-interview"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Submit Interview
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {questionCount > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs text-muted-foreground" data-testid="text-question-count">
                  {questionCount} / {numQuestions} questions
                </span>
              </div>
              <Progress value={Math.min((questionCount / numQuestions) * 100, 100)} className="h-1.5" />
            </div>
          )}

          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-md px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-card-border"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start" data-testid="message-typing">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-card-border rounded-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="resize-none min-h-[44px] max-h-[120px] flex-1"
              rows={1}
              disabled={isSending}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!input.trim() || isSending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
