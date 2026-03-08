import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Briefcase, Send, MessageSquare, Trophy, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type SavedJob = Tables<"saved_jobs">;

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/15 text-primary",
  interview: "bg-warning/15 text-warning",
  offer: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("date_saved", { ascending: false })
      .then(({ data }) => {
        setJobs(data || []);
        setLoading(false);
      });
  }, [user]);

  const total = jobs.length;
  const applied = jobs.filter((j) => j.status !== "saved").length;
  const interviews = jobs.filter((j) => j.status === "interview").length;
  const offers = jobs.filter((j) => j.status === "offer").length;
  const convApplied = total > 0 ? Math.round((applied / total) * 100) : 0;
  const convInterview = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const convOffer = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  const stats = [
    { label: "Saved", value: total, icon: Briefcase },
    { label: "Applied", value: applied, icon: Send },
    { label: "Interviews", value: interviews, icon: MessageSquare },
    { label: "Offers", value: offers, icon: Trophy },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your job search at a glance</p>
        </div>
        <Link to="/add-job">
          <Button size="sm" className="rounded-lg text-xs h-9 px-4">Add Job</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-semibold">{loading ? "–" : value}</p>
          </motion.div>
        ))}
      </div>

      {/* Conversion */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Conversion Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Application rate", value: convApplied, sub: "saved → applied" },
            { label: "Interview rate", value: convInterview, sub: "applied → interview" },
            { label: "Offer rate", value: convOffer, sub: "interview → offer" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-semibold">{loading ? "–" : `${value}%`}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Jobs</h2>
          <Link to="/jobs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <p className="text-muted-foreground text-sm py-12 text-center">Loading...</p>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground text-sm mb-3">No jobs saved yet</p>
              <Link to="/add-job">
                <Button variant="outline" size="sm" className="rounded-lg text-xs">
                  Add your first job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.job_title}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {job.relevance_score !== null && (
                      <span className="text-xs font-medium text-primary">{job.relevance_score}%</span>
                    )}
                    <Badge variant="secondary" className={`${statusColors[job.status]} text-[11px] font-normal rounded-md px-2 py-0.5`}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
