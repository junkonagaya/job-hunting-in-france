import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Briefcase, Send, MessageSquare, Trophy, TrendingUp, Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type SavedJob = Tables<"saved_jobs">;

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/10 text-primary",
  interview: "bg-warning/10 text-warning",
  offer: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("date_saved", { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    fetchJobs();
  }, [user]);

  const total = jobs.length;
  const applied = jobs.filter((j) => j.status !== "saved").length;
  const interviews = jobs.filter((j) => j.status === "interview").length;
  const offers = jobs.filter((j) => j.status === "offer").length;
  const conversionApplied = total > 0 ? Math.round((applied / total) * 100) : 0;
  const conversionInterview = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const conversionOffer = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  const stats = [
    { label: "Saved Jobs", value: total, icon: Briefcase, color: "text-primary" },
    { label: "Applied", value: applied, icon: Send, color: "text-accent" },
    { label: "Interviews", value: interviews, icon: MessageSquare, color: "text-warning" },
    { label: "Offers", value: offers, icon: Trophy, color: "text-success" },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your job search progress</p>
        </div>
        <Link to="/add-job">
          <Button className="gap-2">
            <Briefcase className="w-4 h-4" />
            Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-display font-bold">{loading ? "–" : value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Conversion rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Application Rate", value: conversionApplied, desc: "saved → applied" },
          { label: "Interview Rate", value: conversionInterview, desc: "applied → interview" },
          { label: "Offer Rate", value: conversionOffer, desc: "interview → offer" },
        ].map(({ label, value, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-2xl font-display font-bold">{loading ? "–" : `${value}%`}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display">Recent Jobs</CardTitle>
          <Link to="/jobs">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No jobs saved yet</p>
              <Link to="/add-job">
                <Button variant="outline" size="sm" className="mt-3">Add your first job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{job.job_title}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {job.relevance_score !== null && (
                      <span className="text-xs font-medium text-primary">{job.relevance_score}%</span>
                    )}
                    <Badge variant="secondary" className={statusColors[job.status]}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
