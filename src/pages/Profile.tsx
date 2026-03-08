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
import { Save, Loader2 } from "lucide-react";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const update = (field: string, value: string) => setProfile((p) => ({ ...p, [field]: value }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your experience for AI matching</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input value={profile.full_name || ""} onChange={(e) => update("full_name", e.target.value)}
              className="h-10 rounded-xl bg-background border-border/60 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target Job Title</Label>
            <Input value={profile.target_job_title || ""} onChange={(e) => update("target_job_title", e.target.value)}
              placeholder="e.g. Software Engineer"
              className="h-10 rounded-xl bg-background border-border/60 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Your French Level</Label>
          <Select value={profile.french_level || "none"} onValueChange={(v) => update("french_level", v)}>
            <SelectTrigger className="h-10 rounded-xl bg-background border-border/60 text-sm">
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

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-medium mb-1">Skills & Experience</h2>
          <p className="text-xs text-muted-foreground">Used by AI to calculate relevance scores</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Skills Summary</Label>
          <Textarea value={profile.skills_summary || ""} onChange={(e) => update("skills_summary", e.target.value)}
            placeholder="React, TypeScript, Node.js, 5 years, fintech..." rows={4}
            className="rounded-xl bg-background border-border/60 text-sm resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CV / Resume Text</Label>
          <Textarea value={profile.cv_text || ""} onChange={(e) => update("cv_text", e.target.value)}
            placeholder="Paste your CV text here for better AI matching..." rows={8}
            className="rounded-xl bg-background border-border/60 text-sm resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl h-10 px-5 text-sm gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
