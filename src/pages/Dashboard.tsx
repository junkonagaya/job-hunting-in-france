import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Briefcase, Send, MessageSquare, Trophy, TrendingUp, Target, Edit2, Check, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO,
} from "date-fns";

type SavedJob = Tables<"saved_jobs">;

interface Goals {
  weekly_target: number;
  monthly_target: number;
}

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/15 text-primary",
  interview: "bg-warning/15 text-warning",
  offer: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function ProgressRing({ value, max, size = 80, strokeWidth = 6 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - pct * circumference;
  const color = pct >= 1 ? "hsl(var(--success))" : "hsl(var(--primary))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none">{value}</span>
        <span className="text-[10px] text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goals>({ weekly_target: 10, monthly_target: 40 });
  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState<Goals>({ weekly_target: 10, monthly_target: 40 });

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("saved_jobs").select("*").eq("user_id", user.id)
        .order("date_saved", { ascending: false }),
      supabase.from("application_goals").select("*").eq("user_id", user.id).single(),
    ]).then(([jobsRes, goalsRes]) => {
      setJobs(jobsRes.data || []);
      if (goalsRes.data) {
        const g = { weekly_target: goalsRes.data.weekly_target, monthly_target: goalsRes.data.monthly_target };
        setGoals(g);
        setTempGoals(g);
      }
      setLoading(false);
    });
  }, [user]);

  const saveGoals = async () => {
    if (!user) return;
    const { error } = await supabase.from("application_goals").upsert({
      user_id: user.id,
      weekly_target: tempGoals.weekly_target,
      monthly_target: tempGoals.monthly_target,
    }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error saving goals", description: error.message, variant: "destructive" });
    } else {
      setGoals(tempGoals);
      setEditingGoals(false);
      toast({ title: "Goals updated" });
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const appliedJobs = jobs.filter(j => j.date_applied);

  const weeklyApplied = appliedJobs.filter(j => {
    const d = parseISO(j.date_applied!);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }).length;

  const monthlyApplied = appliedJobs.filter(j => {
    const d = parseISO(j.date_applied!);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  }).length;

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

  const weeklyPct = goals.weekly_target > 0 ? Math.round((weeklyApplied / goals.weekly_target) * 100) : 0;
  const monthlyPct = goals.monthly_target > 0 ? Math.round((monthlyApplied / goals.monthly_target) * 100) : 0;

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

      {/* Application Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Application Goals
          </h2>
          {!editingGoals ? (
            <button onClick={() => { setTempGoals(goals); setEditingGoals(true); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Edit2 className="w-3 h-3" /> Edit targets
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={saveGoals}
                className="text-xs text-success hover:text-success/80 transition-colors flex items-center gap-1">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={() => setEditingGoals(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Weekly */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-5">
              <ProgressRing value={weeklyApplied} max={goals.weekly_target} />
              <div className="flex-1">
                <p className="text-sm font-medium">This Week</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {weeklyApplied >= goals.weekly_target
                    ? "🎉 Weekly target reached!"
                    : `${goals.weekly_target - weeklyApplied} more to hit your target`}
                </p>
                {editingGoals && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Target:</span>
                    <Input type="number" min={1} max={100}
                      value={tempGoals.weekly_target}
                      onChange={(e) => setTempGoals(p => ({ ...p, weekly_target: parseInt(e.target.value) || 1 }))}
                      className="h-7 w-16 rounded-md bg-input border-border text-xs text-center" />
                  </div>
                )}
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(weeklyPct, 100)}%`,
                      backgroundColor: weeklyPct >= 100 ? "hsl(var(--success))" : "hsl(var(--primary))"
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-5">
              <ProgressRing value={monthlyApplied} max={goals.monthly_target} />
              <div className="flex-1">
                <p className="text-sm font-medium">This Month</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {monthlyApplied >= goals.monthly_target
                    ? "🎉 Monthly target reached!"
                    : `${goals.monthly_target - monthlyApplied} more to hit your target`}
                </p>
                {editingGoals && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Target:</span>
                    <Input type="number" min={1} max={500}
                      value={tempGoals.monthly_target}
                      onChange={(e) => setTempGoals(p => ({ ...p, monthly_target: parseInt(e.target.value) || 1 }))}
                      className="h-7 w-16 rounded-md bg-input border-border text-xs text-center" />
                  </div>
                )}
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(monthlyPct, 100)}%`,
                      backgroundColor: monthlyPct >= 100 ? "hsl(var(--success))" : "hsl(var(--primary))"
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
