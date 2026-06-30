import { useState } from "react";
import { useListJobs, useCreateJob, useDeleteJob, useSetActiveJob } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CheckCircle, Briefcase } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function JobsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: jobs, isLoading } = useListJobs();
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();
  const setActiveJob = useSetActiveJob();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReq, setNewReq] = useState("");

  const handleCreate = () => {
    if (!newTitle || !newDesc) return;
    createJob.mutate(
      { data: { title: newTitle, description: newDesc, requirements: newReq } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          setIsCreateOpen(false);
          setNewTitle("");
          setNewDesc("");
          setNewReq("");
          toast({ title: "Job created" });
        }
      }
    );
  };

  const handleSetActive = (id: number) => {
    setActiveJob.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        toast({ title: "Active job updated" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteJob.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        toast({ title: "Job deleted" });
      }
    });
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Descriptions</h1>
          <p className="text-muted-foreground">Manage your open positions and active ranking target.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>Add a new job description to analyze candidates against.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Full job description..." className="h-32" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req">Requirements</Label>
                <Textarea id="req" value={newReq} onChange={e => setNewReq(e.target.value)} placeholder="Key requirements and qualifications..." className="h-24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newTitle || !newDesc || createJob.isPending}>
                {createJob.isPending ? "Creating..." : "Create Job"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted/50" />)}
        </div>
      ) : jobs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-card/50">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No jobs found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first job description to get started.</p>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map(job => (
            <Card key={job.id} className={`flex flex-col transition-all duration-200 ${job.isActive ? 'border-primary ring-1 ring-primary shadow-md' : 'hover:border-primary/50'}`}>
              <CardHeader className="pb-3 flex-none">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{job.title}</CardTitle>
                    <CardDescription>Created {format(new Date(job.createdAt), "MMM d, yyyy")}</CardDescription>
                  </div>
                  {job.isActive && <Badge variant="default" className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{job.description}</p>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between flex-none gap-2">
                <Button 
                  variant={job.isActive ? "secondary" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleSetActive(job.id)}
                  disabled={job.isActive || setActiveJob.isPending}
                >
                  {job.isActive ? "Active Target" : "Set as Active"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => handleDelete(job.id)}
                  disabled={deleteJob.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
