import { useGetAnalyticsSummary, useGetScoreDistribution, useGetSkillDistribution } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function AnalyticsPage() {
  const { data: summary, isLoading: isSummaryLoading } = useGetAnalyticsSummary();
  const { data: scoreDist, isLoading: isScoreLoading } = useGetScoreDistribution();
  const { data: skillDist, isLoading: isSkillLoading } = useGetSkillDistribution();

  if (isSummaryLoading || isScoreLoading || isSkillLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  const handleExportPdf = () => {
    window.location.href = '/api/export/pdf';
  };

  const handleExportXlsx = () => {
    window.location.href = '/api/export/xlsx';
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your candidate pool metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportXlsx}>
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </Button>
          <Button onClick={handleExportPdf}>
            <Download className="h-4 w-4 mr-2" /> Export PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Number of candidates in each AI score range</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDist} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDist?.map((entry, index) => {
                    // Color based on range roughly
                    const isHigh = entry.range.includes("80-100") || entry.range.includes("90-100") || entry.range.includes("70-100");
                    const isLow = entry.range.includes("0-40") || entry.range.includes("0-30");
                    return (
                      <Cell key={`cell-${index}`} fill={isHigh ? 'hsl(var(--primary))' : isLow ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Top Skills Detected</CardTitle>
            <CardDescription>Most common skills across all analyzed resumes</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillDist} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="skill" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{Math.round(summary?.avgScore || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summary?.totalCandidates || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Candidates imported</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Analyzed Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {summary?.totalCandidates ? Math.round((summary.analyzedCandidates / summary.totalCandidates) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">{summary?.analyzedCandidates} scored</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
