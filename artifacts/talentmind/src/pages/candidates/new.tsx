import { useState } from "react";
import { useCreateCandidate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function NewCandidatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCandidate = useCreateCandidate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [education, setEducation] = useState("");
  const [resumeText, setResumeText] = useState("");
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }

    createCandidate.mutate(
      { 
        data: { 
          name, 
          email, 
          skills, 
          experienceYears: parseInt(experienceYears) || 0, 
          education, 
          resumeText 
        } 
      },
      {
        onSuccess: (candidate) => {
          toast({ title: "Candidate created successfully" });
          setLocation(`/candidates/${candidate.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create candidate", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
      <Button variant="ghost" className="mb-4 -ml-4" onClick={() => setLocation('/candidates')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Add Candidate</h1>
        <p className="text-muted-foreground">Manually enter a candidate's profile.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Enter the candidate's basic information and resume.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input id="experience" type="number" min="0" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input id="education" value={education} onChange={e => setEducation(e.target.value)} placeholder="BS Computer Science" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-12 border rounded-md bg-muted/20">
                {skills.map(skill => (
                  <span key={skill} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Input 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)} 
                  onKeyDown={handleAddSkill} 
                  placeholder="Type a skill and press Enter..." 
                  className="border-0 bg-transparent flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[200px] h-8 p-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume Text</Label>
              <Textarea 
                id="resume" 
                value={resumeText} 
                onChange={e => setResumeText(e.target.value)} 
                placeholder="Paste the candidate's full resume here..." 
                className="min-h-64 font-mono text-sm" 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={() => setLocation('/candidates')}>Cancel</Button>
            <Button type="submit" disabled={createCandidate.isPending}>
              {createCandidate.isPending ? "Saving..." : "Save Candidate"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
