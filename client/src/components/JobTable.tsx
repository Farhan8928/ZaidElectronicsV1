import { GoogleSheetsJob } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Receipt } from "lucide-react";

interface JobTableProps {
  jobs: GoogleSheetsJob[];
  onEdit: (job: GoogleSheetsJob, index: number) => void;
  onDelete: (index: number) => void;
  onGenerateReceipt: (job: GoogleSheetsJob) => void;
}

export function JobTable({ jobs, onEdit, onDelete, onGenerateReceipt }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center" data-testid="empty-jobs">
        <p className="text-muted-foreground">No jobs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Customer</TableHead>
              <TableHead className="font-medium">Mobile</TableHead>
              <TableHead className="font-medium">TV Model</TableHead>
              <TableHead className="font-medium">Work Done</TableHead>
              <TableHead className="font-medium">Price</TableHead>
              <TableHead className="font-medium">Parts Cost</TableHead>
              <TableHead className="font-medium">Profit</TableHead>
              <TableHead className="font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job, index) => (
              <TableRow key={index} className="hover:bg-muted/50" data-testid={`job-row-${index}`}>
                <TableCell className="whitespace-nowrap" data-testid={`job-date-${index}`}>
                  {job.date}
                </TableCell>
                <TableCell>
                  <div className="font-medium" data-testid={`job-customer-${index}`}>
                    {job.customerName}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap" data-testid={`job-mobile-${index}`}>
                  {job.mobile}
                </TableCell>
                <TableCell data-testid={`job-tv-model-${index}`}>
                  {job.tvModel}
                </TableCell>
                <TableCell className="max-w-xs truncate" data-testid={`job-work-done-${index}`}>
                  {job.workDone}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium" data-testid={`job-price-${index}`}>
                  ₹{job.price.toLocaleString()}
                </TableCell>
                <TableCell className="whitespace-nowrap" data-testid={`job-parts-cost-${index}`}>
                  ₹{(job.partsCost || 0).toLocaleString()}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium text-green-600" data-testid={`job-profit-${index}`}>
                  ₹{job.profit.toLocaleString()}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(job, index)}
                      data-testid={`button-edit-${index}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(index)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onGenerateReceipt(job)}
                      data-testid={`button-receipt-${index}`}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
