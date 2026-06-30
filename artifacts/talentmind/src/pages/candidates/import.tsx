import { useState } from "react";
import { useListJobs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";

export default function ImportCandidatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: jobs } = useListJobs();
  
  const [csvData, setCsvData] = useState("");
  const [jobId, setJobId] = useState<string>("none");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({ title: "Please paste CSV data", variant: "destructive" });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const res = await fetch('/api/candidates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          csvData, 
          jobId: jobId !== "none" ? Number(jobId) : undefined 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Import failed");
      
      toast({ 
        title: "Import Successful", 
        description: `Imported ${data.imported} candidates.` 
      });
      
      setLocation('/candidates');
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
      <Button variant="ghost" className="mb-4 -ml-4" onClick={() => setLocation('/candidates')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Import Candidates</h1>
        <p className="text-muted-foreground">Bulk upload candidates via CSV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paste CSV Data</CardTitle>
              <CardDescription>Paste your spreadsheet data with headers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Job (Optional)</Label>
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Job Association</SelectItem>
                    {jobs?.map(job => (
                      <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Candidates will be automatically associated with this job if selected.</p>
              </div>
              
              <div className="space-y-2">
                <Label>CSV Content</Label>
                <Textarea 
                  value={csvData} 
                  onChange={e => setCsvData(e.target.value)} 
                  placeholder="name,email,skills,experienceYears,education,resumeText&#10;John Doe,john@example.com,React|TypeScript,5,BS CS,..." 
                  className="min-h-[300px] font-mono text-sm whitespace-pre" 
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={() => setLocation('/candidates')}>Cancel</Button>
              <Button onClick={handleImport} disabled={!csvData.trim() || isImporting}>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importing..." : "Import CSV"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p>Your CSV must include a header row with the exact column names below:</p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground pl-4">
                <li><strong className="text-foreground">name</strong> (Required)</li>
                <li><strong className="text-foreground">email</strong> (Required)</li>
                <li><strong className="text-foreground">skills</strong> (Pipe-separated, e.g., React|Node)</li>
                <li><strong className="text-foreground">experienceYears</strong> (Number)</li>
                <li><strong className="text-foreground">education</strong> (Text)</li>
                <li><strong className="text-foreground">resumeText</strong> (Full resume text)</li>
              </ul>
              
              <div className="mt-4 p-3 bg-card border rounded text-xs font-mono overflow-x-auto">
                name,email,skills,experienceYears,education<br/>
                Jane,jane@a.co,React|Vue,4,BS CS<br/>
                Bob,bob@b.co,Java|SQL,8,MS CS
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
