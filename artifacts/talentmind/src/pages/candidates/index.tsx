import { useState } from "react";
import { useListCandidates, useListJobs, useDeleteCandidate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Link } from "wouter";
import { Search, Trash2, UserPlus, Upload, Sparkles, Download, Eye } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/src/custom-fetch"; // fallback if useRankCandidates isn't generated exactly, but we use the generated one
import { useToast } from "@/hooks/use-toast";

// Workaround to manually call rank if the hook isn't available or we want to use fetch directly
const rankCandidatesFn = async (jobId: number) => {
  const res = await fetch('/api/candidates/rank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  if (!res.ok) throw new Error("Failed to rank");
  return res.json();
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState<string>("all");
  
  const { data: candidates, isLoading } = useListCandidates(
    jobId !== "all" ? { jobId: Number(jobId) } : undefined
  );
  const { data: jobs } = useListJobs();
  const deleteCandidate = useDeleteCandidate();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const activeJob = jobs?.find(j => j.isActive);

  const rankMutation = useMutation({
    mutationFn: rankCandidatesFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({ title: "Candidates ranked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to rank candidates", variant: "destructive" });
    }
  });

  const handleRank = () => {
    if (!activeJob) {
      toast({ title: "No active job", description: "Set an active job first", variant: "destructive" });
      return;
    }
    rankMutation.mutate(activeJob.id);
  };

  const handleDelete = (id: number) => {
    deleteCandidate.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
        toast({ title: "Candidate deleted" });
      }
    });
  };

  const filteredCandidates = candidates?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">Manage and rank your talent pool.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/candidates/import"><Upload className="h-4 w-4 mr-2" /> Import CSV</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/candidates/new"><UserPlus className="h-4 w-4 mr-2" /> Add Manually</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/api/export/csv'}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button 
            onClick={handleRank} 
            disabled={!activeJob || rankMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className={`h-4 w-4 mr-2 ${rankMutation.isPending ? 'animate-spin' : ''}`} /> 
            {rankMutation.isPending ? "Ranking..." : "Rank with AI"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search candidates..." 
                className="pl-8" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs?.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-center">AI Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading candidates...
                  </TableCell>
                </TableRow>
              ) : filteredCandidates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No candidates found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates?.map((candidate) => (
                  <TableRow key={candidate.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {candidate.rank ? `#${candidate.rank}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{candidate.name}</span>
                        <span className="text-sm text-muted-foreground">{candidate.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {candidate.experienceYears} years
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={candidate.aiScore} />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/candidates/${candidate.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(candidate.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
