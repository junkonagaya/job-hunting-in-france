import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Upload, FileText } from "lucide-react";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: "", skills_summary: "", cv_text: "",
    target_job_title: "", french_level: "none",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); setLoading(false); });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: profile.full_name, skills_summary: profile.skills_summary,
        cv_text: profile.cv_text, target_job_title: profile.target_job_title,
        french_level: profile.french_level,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Profile saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept .txt, .pdf (text extraction), .doc, .docx
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    setParsing(true);
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
        const text = await file.text();
        update("cv_text", text);
        toast({ title: "Resume loaded", description: "Text extracted from file. Review and save." });
      } else {
        // PDF/DOC/DOCX — send to edge function for AI parsing
        const formData = new FormData();
        formData.append("file", file);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to parse document");
        update("cv_text", result.text);
        toast({ title: "Resume parsed", description: "Text extracted via AI. Review and save." });
      }
    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message || "Please paste your resume text manually.", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const update = (field: string, value: string) => setProfile((p) => ({ ...p, [field]: value }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your experience for AI relevance scoring</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
            <Input value={profile.full_name || ""} onChange={(e) => update("full_name", e.target.value)}
              className="h-10 rounded-lg bg-input border-border text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Target Job Title</Label>
            <Input value={profile.target_job_title || ""} onChange={(e) => update("target_job_title", e.target.value)}
              placeholder="e.g. Software Engineer"
              className="h-10 rounded-lg bg-input border-border text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Your French Level</Label>
          <Select value={profile.french_level || "none"} onValueChange={(v) => update("french_level", v)}>
            <SelectTrigger className="h-10 rounded-lg bg-input border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No French</SelectItem>
              <SelectItem value="A1">A1 - Beginner</SelectItem>
              <SelectItem value="A2">A2 - Elementary</SelectItem>
              <SelectItem value="B1">B1 - Intermediate</SelectItem>
              <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
              <SelectItem value="C1">C1 - Advanced</SelectItem>
              <SelectItem value="C2">C2 - Proficient</SelectItem>
              <SelectItem value="native">Native Speaker</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-medium mb-1">Resume & Skills</h2>
          <p className="text-xs text-muted-foreground">Used by AI to score job relevance. Upload your resume or paste the text.</p>
        </div>

        {/* Resume upload */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Upload Resume</Label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-input text-sm cursor-pointer hover:bg-accent/50 transition-colors">
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              <span className="text-muted-foreground">{parsing ? "Reading..." : "Choose file"}</span>
              <input
                type="file"
                accept=".txt,.md,.text,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                className="hidden"
                disabled={parsing}
              />
            </label>
            {profile.cv_text && (
              <span className="flex items-center gap-1 text-xs text-success">
                <FileText className="w-3.5 h-3.5" />
                Resume loaded
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60">Supports PDF, Word (.doc/.docx), and text files. Max 5MB.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Skills Summary</Label>
          <Textarea value={profile.skills_summary || ""} onChange={(e) => update("skills_summary", e.target.value)}
            placeholder="React, TypeScript, Node.js, 5 years, fintech..." rows={4}
            className="rounded-lg bg-input border-border text-sm resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">CV / Resume Text</Label>
          <Textarea value={profile.cv_text || ""} onChange={(e) => update("cv_text", e.target.value)}
            placeholder="Paste your CV text here for AI matching..." rows={8}
            className="rounded-lg bg-input border-border text-sm resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rounded-lg h-10 px-5 text-sm gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
