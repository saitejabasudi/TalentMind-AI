import { useGetCandidate } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Briefcase, GraduationCap, Mail, Clock, BrainCircuit, Target, CheckCircle2 } from "lucide-react";
import { ScoreBadge } from "@/components/ui/score-badge";

export default function CandidateDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: candidate, isLoading } = useGetCandidate(id, {
    query: { enabled: !!id, queryKey: ["/api/candidates", id] }
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!candidate) return <div className="p-8">Candidate not found.</div>;

  // Circular gauge component
  const ScoreGauge = ({ score, label, colorClass }: { score: number | null | undefined, label: string, colorClass: string }) => {
    const value = score || 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="relative flex items-center justify-center w-32 h-32">
          <svg className="transform -rotate-90 w-full h-full">
            <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/30" />
            <circle 
              cx="64" 
              cy="64" 
              r="40" 
              stroke="currentColor" 
              strokeWidth="8" 
              fill="transparent" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              className={`transition-all duration-1000 ease-out ${colorClass}`} 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score !== null && score !== undefined ? score : '-'}</span>
          </div>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    );
  };

  const getColorForScore = (score: number | null | undefined) => {
    if (!score) return "text-muted";
    if (score <= 40) return "text-destructive";
    if (score <= 70) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <Button variant="ghost" className="mb-2 -ml-4" asChild>
        <Link href="/candidates"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates</Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{candidate.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {candidate.email}</span>
            {candidate.rank && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                Rank #{candidate.rank}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-right mr-4">
            <div className="text-sm text-muted-foreground mb-1">Overall AI Score</div>
            <ScoreBadge score={candidate.aiScore} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Analysis & Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {candidate.aiSummary ? (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Executive Summary</h3>
                    <p className="text-sm leading-relaxed">{candidate.aiSummary}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendation</h3>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-foreground">{candidate.aiRecommendation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>This candidate has not been analyzed yet.</p>
                  <p className="text-sm">Run AI ranking from the candidates list.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Experience</div>
                    <div className="text-sm text-muted-foreground">{candidate.experienceYears} Years</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Education</div>
                    <div className="text-sm text-muted-foreground">{candidate.education || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 bg-muted">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length === 0 && <span className="text-sm text-muted-foreground">No skills listed.</span>}
                </div>
              </div>

              {candidate.resumeText && (
                <div>
                  <h3 className="font-medium mb-3">Resume</h3>
                  <div className="p-4 bg-muted/30 border rounded-lg text-sm font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {candidate.resumeText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Scoring */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-center">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-8 pt-4">
              <ScoreGauge 
                score={candidate.aiScore} 
                label="Overall Match" 
                colorClass={getColorForScore(candidate.aiScore)} 
              />
              
              <div className="w-full h-px bg-border"></div>
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Skills</span>
                  </div>
                  <div className={`text-2xl font-bold ${getColorForScore(candidate.skillMatchScore)}`}>
                    {candidate.skillMatchScore || '-'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Experience</span>
                  </div>
                  <div className={`text-2xl font-bold ${getColorForScore(candidate.experienceMatchScore)}`}>
                    {candidate.experienceMatchScore || '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
