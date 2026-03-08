import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link as LinkIcon, Loader2 } from "lucide-react";

export default function AddJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    job_title: "", company_name: "", source: "linkedin",
    source_url: "", location: "", job_description: "",
    date_posted: "", notes: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("saved_jobs").insert({
        user_id: user.id, job_title: form.job_title, company_name: form.company_name,
        source: form.source || null, source_url: form.source_url || null,
        location: form.location || null, job_description: form.job_description || null,
        date_posted: form.date_posted || null, notes: form.notes || null,
      });
      if (error) throw error;
      toast({ title: "Job saved!", description: `${form.job_title} at ${form.company_name}` });
      navigate("/jobs");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Job</h1>
        <p className="text-muted-foreground text-sm mt-1">Save a new position to track</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Job Title *</Label>
              <Input value={form.job_title} onChange={(e) => update("job_title", e.target.value)}
                placeholder="e.g. Frontend Developer" required
                className="h-10 rounded-lg bg-input border-border text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Company *</Label>
              <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)}
                placeholder="e.g. Doctolib" required
                className="h-10 rounded-lg bg-input border-border text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Source</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger className="h-10 rounded-lg bg-input border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="welcometothejungle">Welcome to the Jungle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Location</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Paris, France"
                className="h-10 rounded-lg bg-input border-border text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Job URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={form.source_url} onChange={(e) => update("source_url", e.target.value)}
                placeholder="https://linkedin.com/jobs/..."
                className="pl-9 h-10 rounded-lg bg-input border-border text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date Posted</Label>
            <Input type="date" value={form.date_posted} onChange={(e) => update("date_posted", e.target.value)}
              className="h-10 rounded-lg bg-input border-border text-sm" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Job Description</Label>
            <Textarea value={form.job_description} onChange={(e) => update("job_description", e.target.value)}
              placeholder="Paste the job description here for AI analysis..."
              rows={6} className="rounded-lg bg-input border-border text-sm resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
              placeholder="Any personal notes..." rows={3}
              className="rounded-lg bg-input border-border text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="rounded-lg h-10 px-5 text-sm gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Job
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/jobs")}
            className="rounded-lg h-10 px-5 text-sm">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
