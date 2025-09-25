import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { GoogleSheetsJob } from "@/types/schema";
import { JobForm } from "@/components/JobForm";
import { useToast } from "@/hooks/use-toast";

export default function JobEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addJobMutation = useMutation({
    mutationFn: (job: GoogleSheetsJob) => googleSheetsService.addJob(job),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job has been added successfully!",
      });
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      // Full refresh to reflect latest state throughout the app
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (job: GoogleSheetsJob) => {
    await addJobMutation.mutateAsync(job);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="title-job-entry">Add New Job</h1>
          <p className="text-muted-foreground">Enter the completed job details below.</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <JobForm
            onSubmit={handleSubmit}
            loading={addJobMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
