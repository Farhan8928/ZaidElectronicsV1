import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JobProvider } from "@/contexts/JobContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { Sidebar } from "@/components/Sidebar";
import { Suspense, lazy, useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

// Lazy load components for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const JobEntry = lazy(() => import("@/pages/JobEntry"));
const JobList = lazy(() => import("@/pages/JobList"));
const Reports = lazy(() => import("@/pages/Reports"));
const Export = lazy(() => import("@/pages/Export"));
const Whatsapp = lazy(() => import("@/pages/Whatsapp"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

function Protected({ children }: { children: JSX.Element }) {
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const handleVerify = () => {
    if (pin === "8928") {
      setAuthorized(true);
    }
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-4 bg-card border border-border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold">Enter 4-digit PIN</h2>
          <p className="text-sm text-muted-foreground">Access is restricted.</p>
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={pin} onChange={setPin}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={handleVerify} disabled={pin.length !== 4} className="w-full">Verify</Button>
        </div>
      </div>
    );
  }
  return children;
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/" component={() => (
          <Protected>
            <Dashboard />
          </Protected>
        )} />
        <Route path="/add-job" component={JobEntry} />
        <Route path="/jobs" component={JobList} />
        <Route path="/reports" component={() => (
          <Protected>
            <Reports />
          </Protected>
        )} />
        <Route path="/export" component={() => (
          <Protected>
            <Export />
          </Protected>
        )} />
        <Route path="/whatsapp" component={Whatsapp} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
