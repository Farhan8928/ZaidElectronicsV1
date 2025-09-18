import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JobProvider } from "@/contexts/JobContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import JobEntry from "@/pages/JobEntry";
import JobList from "@/pages/JobList";
import Reports from "@/pages/Reports";
import Export from "@/pages/Export";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add-job" component={JobEntry} />
      <Route path="/jobs" component={JobList} />
      <Route path="/reports" component={Reports} />
      <Route path="/export" component={Export} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <JobProvider>
          <TooltipProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
            <Toaster />
          </TooltipProvider>
        </JobProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
