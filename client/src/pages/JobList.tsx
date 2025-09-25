import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { GoogleSheetsJob } from "@shared/schema";
import { SearchFilters } from "@/components/SearchFilters";
import { JobTable } from "@/components/JobTable";
import { VirtualJobTable } from "@/components/VirtualJobTable";
import { EditJobModal } from "@/components/EditJobModal";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function JobList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [editingJob, setEditingJob] = useState<{ job: GoogleSheetsJob; index: number } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: jobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => googleSheetsService.getAllJobs(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const normalizedJobs = useMemo(() => {
    const toYmd = (raw: string): string => {
      try {
        if (!raw) return '';
        const str = String(raw).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        const dmy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
        if (str.includes('T')) return str.split('T')[0];
        const d = new Date(str);
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        }
        return str;
      } catch {
        return raw;
      }
    };
    return jobs.map(j => {
      const tv = String((j as any).tvModel ?? '');
      const isoInTv = tv.match(/^(\d{4}-\d{2}-\d{2})T/);
      const candidateDate = isoInTv ? isoInTv[1] : String(j.date as unknown as string);
      return { ...j, date: toYmd(candidateDate) };
    });
  }, [jobs]);

  const updateJobMutation = useMutation({
    mutationFn: ({ index, job }: { index: number; job: GoogleSheetsJob }) => 
      googleSheetsService.updateJob(index.toString(), job),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setEditingJob(null);
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job.",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (index: number) => googleSheetsService.deleteJob(index.toString()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setDeletingIndex(null);
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job.",
        variant: "destructive",
      });
      setDeletingIndex(null);
    },
  });

  const filteredJobs = useMemo(() => {
    let filtered = normalizedJobs;

    // Search filter with debounced query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.customerName.toLowerCase().includes(query) ||
        job.mobile.toString().includes(query) ||
        job.tvModel.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.date);
        
        switch (dateFilter) {
          case "today":
            return job.date === today;
          case "this-week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return jobDate >= weekAgo;
          case "this-month":
            return jobDate.getMonth() === now.getMonth() && 
                   jobDate.getFullYear() === now.getFullYear();
          case "last-month":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return jobDate.getMonth() === lastMonth.getMonth() && 
                   jobDate.getFullYear() === lastMonth.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [normalizedJobs, debouncedSearchQuery, dateFilter]);

  const handleEdit = (job: GoogleSheetsJob, index: number) => {
    setEditingJob({ job, index });
  };

  const handleDelete = (index: number) => {
    setDeletingIndex(index);
  };

  const confirmDelete = () => {
    if (deletingIndex !== null) {
      deleteJobMutation.mutate(deletingIndex);
    }
  };

  const handleUpdateJob = async (job: GoogleSheetsJob) => {
    if (editingJob) {
      await updateJobMutation.mutateAsync({ index: editingJob.index, job });
    }
  };

  const handleGenerateReceipt = (job: GoogleSheetsJob) => {
    // Generate a simple receipt
    const receiptContent = `
ZAID ELECTRONICS
Electronics Repair Service
==========================

Date: ${job.date}
Customer: ${job.customerName}
Mobile: ${job.mobile}
TV Model: ${job.tvModel}

Work Done:
${job.workDone}

==========================
Price Charged: ₹${job.price}
Parts Cost: ₹${job.partsCost || 0}
Profit: ₹${job.profit}
==========================

Thank you for your business!
    `.trim();

    // Create and download receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${job.customerName}-${job.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Generated",
      description: "Receipt has been downloaded successfully!",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
  };

  const handleRefresh = () => {
    // Do a full page reload to mimic browser refresh and clear in-memory caches
    window.location.reload();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error loading jobs: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold" data-testid="title-job-list">Job List</h1>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Search and Filter Bar */}
        <SearchFilters
          searchQuery={searchQuery}
          dateFilter={dateFilter}
          onSearchChange={setSearchQuery}
          onDateFilterChange={setDateFilter}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Jobs Table */}
      {isLoading ? (
        <div className="bg-card rounded-lg border border-border p-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        // Use virtual scrolling for large datasets (>100 items)
        filteredJobs.length > 100 ? (
          <VirtualJobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateReceipt={handleGenerateReceipt}
            containerHeight={600}
            itemHeight={60}
          />
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onGenerateReceipt={handleGenerateReceipt}
          />
        )
      )}

      {/* Edit Modal */}
      <EditJobModal
        open={editingJob !== null}
        onOpenChange={(open) => !open && setEditingJob(null)}
        job={editingJob?.job || null}
        onSubmit={handleUpdateJob}
        loading={updateJobMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deletingIndex !== null} onOpenChange={(open) => !open && setDeletingIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
