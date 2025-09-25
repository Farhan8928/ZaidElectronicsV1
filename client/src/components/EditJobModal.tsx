import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GoogleSheetsJob } from "@/types/schema";
import { JobForm } from "./JobForm";

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: GoogleSheetsJob | null;
  onSubmit: (job: GoogleSheetsJob) => Promise<void>;
  loading?: boolean;
}

export function EditJobModal({ open, onOpenChange, job, onSubmit, loading }: EditJobModalProps) {
  if (!job) return null;

  const handleSubmit = async (updatedJob: GoogleSheetsJob) => {
    await onSubmit(updatedJob);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription className="sr-only">Update job details and save</DialogDescription>
        </DialogHeader>
        
        <JobForm
          initialData={job}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
