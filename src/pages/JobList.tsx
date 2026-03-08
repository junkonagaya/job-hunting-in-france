import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ExternalLink, Search, PlusCircle, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";

type SavedJob = Tables<"saved_jobs">;

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/15 text-primary",
  interview: "bg-warning/15 text-warning",
  offer: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const frenchLabels: Record<string, string> = {
  unknown: "Unknown",
  none: "Not required",
  A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2",
  native: "Native",
};

export default function JobList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"relevance" | "date_saved" | "date_posted">("date_saved");
  const [scoringJobId, setScoringJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order(sortBy === "relevance" ? "relevance_score" : sortBy, { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [user, sortBy]);

  const updateStatus = async (jobId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "applied") updates.date_applied = new Date().toISOString();
    const { error } = await supabase.from("saved_jobs").update(updates).eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchJobs();
  };

  const scoreJob = async (jobId: string) => {
    setScoringJobId(jobId);
    try {
      const { data, error } = await supabase.functions.invoke("score-job", {
        body: { job_id: jobId },
      });

      if (error) {
        toast({ title: "Scoring failed", description: error.message, variant: "destructive" });
        return;
      }

      if (data?.error) {
        toast({ title: "Scoring failed", description: data.error, variant: "destructive" });
        return;
      }

      toast({
        title: `Relevance: ${data.relevance_score}%`,
        description: data.summary,
      });
      fetchJobs();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setScoringJobId(null);
    }
  };

  const scoreAllUnscored = async () => {
    const unscored = jobs.filter(j => j.relevance_score === null && j.job_description);
    if (unscored.length === 0) {
      toast({ title: "Nothing to score", description: "All jobs with descriptions are already scored." });
      return;
    }
    for (const job of unscored) {
      await scoreJob(job.id);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.job_title.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unscoredCount = jobs.filter(j => j.relevance_score === null && j.job_description).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} positions tracked</p>
        </div>
        <div className="flex gap-2">
          {unscoredCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg text-xs h-9 px-4 gap-1.5"
              onClick={scoreAllUnscored}
              disabled={scoringJobId !== null}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Score {unscoredCount} jobs
            </Button>
          )}
          <Link to="/add-job">
            <Button size="sm" className="rounded-lg text-xs h-9 px-4 gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              Add Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-input border-border text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs bg-input border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs bg-input border-border">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_saved">Date saved</SelectItem>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="date_posted">Date posted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-16">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16">No jobs found</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((job) => (
              <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{job.job_title}</p>
                    {job.source_url && (
                      <a href={job.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-muted-foreground/40 hover:text-primary flex-shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{job.company_name}</span>
                    {job.location && (
                      <span className="text-xs text-muted-foreground/50">· {job.location}</span>
                    )}
                  </div>
                </div>

                {/* French level */}
                <Badge variant="outline" className="text-[10px] rounded-md px-2 py-0.5 border-border text-muted-foreground hidden sm:inline-flex">
                  🇫🇷 {frenchLabels[job.french_level_required || "unknown"]}
                </Badge>

                {/* Score */}
                {job.relevance_score !== null ? (
                  <div className="hidden sm:flex items-center gap-1.5 w-20">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${job.relevance_score}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-primary w-8 text-right">{job.relevance_score}%</span>
                  </div>
                ) : job.job_description ? (
                  <button
                    onClick={() => scoreJob(job.id)}
                    disabled={scoringJobId !== null}
                    className="hidden sm:flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {scoringJobId === job.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Score
                  </button>
                ) : (
                  <span className="hidden sm:block text-[11px] text-muted-foreground/40 w-20 text-right">–</span>
                )}

                {/* Date */}
                <span className="hidden md:block text-[11px] text-muted-foreground/50 w-14 text-right">
                  {job.date_posted ? format(new Date(job.date_posted), "MMM d") : "–"}
                </span>

                {/* Status */}
                <Select value={job.status} onValueChange={(v) => updateStatus(job.id, v)}>
                  <SelectTrigger className="h-7 w-[100px] text-[11px] rounded-md border-0 bg-transparent p-0 justify-end gap-1">
                    <Badge variant="secondary" className={`${statusColors[job.status]} text-[11px] font-normal rounded-md px-2 py-0.5`}>
                      {job.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
