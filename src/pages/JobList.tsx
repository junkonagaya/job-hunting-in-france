import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ExternalLink, Search, PlusCircle, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

type SavedJob = Tables<"saved_jobs">;

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/10 text-primary",
  interview: "bg-warning/10 text-warning",
  offer: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const frenchLabels: Record<string, string> = {
  unknown: "Unknown",
  none: "Not required",
  A1: "A1 - Beginner",
  A2: "A2 - Elementary",
  B1: "B1 - Intermediate",
  B2: "B2 - Upper Int.",
  C1: "C1 - Advanced",
  C2: "C2 - Proficient",
  native: "Native",
};

export default function JobList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "date_saved" | "date_posted">("date_saved");

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

  useEffect(() => {
    fetchJobs();
  }, [user, sortBy]);

  const updateStatus = async (jobId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "applied") updates.date_applied = new Date().toISOString();

    const { error } = await supabase
      .from("saved_jobs")
      .update(updates)
      .eq("id", jobId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchJobs();
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.job_title.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">My Jobs</h1>
          <p className="text-muted-foreground mt-1">{jobs.length} jobs tracked</p>
        </div>
        <Link to="/add-job">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_saved">Date saved</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date_posted">Date posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>French</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{job.job_title}</p>
                          <p className="text-xs text-muted-foreground">{job.company_name}</p>
                          {job.location && (
                            <p className="text-xs text-muted-foreground">{job.location}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          🇫🇷 {frenchLabels[job.french_level_required || "unknown"] || job.french_level_required}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.relevance_score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${job.relevance_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{job.relevance_score}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={job.status}
                          onValueChange={(v) => updateStatus(job.id, v)}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <Badge variant="secondary" className={`${statusColors[job.status]} text-xs`}>
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
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {job.date_posted
                            ? format(new Date(job.date_posted), "MMM d")
                            : "–"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.source_url && (
                          <a
                            href={job.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
