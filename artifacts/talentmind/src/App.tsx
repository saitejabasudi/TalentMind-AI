import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import JobsPage from "@/pages/jobs";
import CandidatesPage from "@/pages/candidates/index";
import NewCandidatePage from "@/pages/candidates/new";
import ImportCandidatePage from "@/pages/candidates/import";
import CandidateDetailPage from "@/pages/candidates/detail";
import AnalyticsPage from "@/pages/analytics";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jobs" component={JobsPage} />
        <Route path="/candidates" component={CandidatesPage} />
        <Route path="/candidates/new" component={NewCandidatePage} />
        <Route path="/candidates/import" component={ImportCandidatePage} />
        <Route path="/candidates/:id" component={CandidateDetailPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="talentmind-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
