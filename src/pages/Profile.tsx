import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2 } from "lucide-react";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: "",
    skills_summary: "",
    cv_text: "",
    target_job_title: "",
    french_level: "none",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          skills_summary: profile.skills_summary,
          cv_text: profile.cv_text,
          target_job_title: profile.target_job_title,
          french_level: profile.french_level,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved", description: "Your profile has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Your experience and preferences for AI matching</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name || ""}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Job Title</Label>
              <Input
                value={profile.target_job_title || ""}
                onChange={(e) => update("target_job_title", e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Your French Level</Label>
            <Select
              value={profile.french_level || "none"}
              onValueChange={(v) => update("french_level", v)}
            >
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Skills & Experience</CardTitle>
          <CardDescription>
            This is used by AI to calculate relevance scores for your saved jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Skills Summary</Label>
            <Textarea
              value={profile.skills_summary || ""}
              onChange={(e) => update("skills_summary", e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, 5 years experience, fintech background..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>CV / Resume Text</Label>
            <Textarea
              value={profile.cv_text || ""}
              onChange={(e) => update("cv_text", e.target.value)}
              placeholder="Paste your CV text here for better AI matching..."
              rows={8}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
