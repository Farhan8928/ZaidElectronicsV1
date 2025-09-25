import { GoogleSheetsJob } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Receipt, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Utility function: show the date exactly as stored without transformation
const formatDate = (dateString: string): string => {
  if (!dateString || String(dateString).trim() === '') return 'No Date';
  return String(dateString);
};

interface JobTableProps {
  jobs: GoogleSheetsJob[];
  onEdit: (job: GoogleSheetsJob, index: number) => void;
  onDelete: (index: number) => void;
  onGenerateReceipt: (job: GoogleSheetsJob) => void;
}

export function JobTable({ jobs, onEdit, onDelete, onGenerateReceipt }: JobTableProps) {
  const { toast } = useToast();
  const [renderTick, setRenderTick] = useState(0);

  const markSent = (customerName: string, date: string) => {
    const key = 'sentReports';
    const store = JSON.parse(localStorage.getItem(key) || '{}');
    store[`${customerName}|${date}`] = true;
    localStorage.setItem(key, JSON.stringify(store));
  };

  const isSent = (customerName: string, date: string) => {
    const store = JSON.parse(localStorage.getItem('sentReports') || '{}');
    return !!store[`${customerName}|${date}`];
  };

  const sendWhatsApp = async (job: GoogleSheetsJob) => {
    try {
      const template = [
        '━━━━━━━━━━━━━━━━━━━━',
        '🛠️ ZAID ELECTRONICS',
        'Repair Summary',
        '━━━━━━━━━━━━━━━━━━━━',
        `📅 Date: ${job.date}`,
        `👤 Customer: ${job.customerName}`,
        `📺 TV Model: ${job.tvModel}`,
        `📝 Work Done: ${job.workDone}`,
        `💳 Amount Charged: ₹${job.price.toLocaleString()}`,
        '',
        'Thank you for choosing us! If anything needs attention, just reply here. 😊',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '📍 Shop Details',
        'ZAID ELECTRONICS',
        'Shop No- 6, H-sector B-line, Balaji Mandir Rd,',
        'Opposite Saibaba Mandir, near Madina dairy,',
        'Dhobi Ghat, Cheeta Camp, Trombay, Mumbai, Maharashtra 400088',
        '📞 Contact: 8291665919 / 9821473182',
        '',
        '⭐ Please rate our shop by searching:',
        '“zaid electronics cheeta camp”'
      ].join('\n');
      const baseUrl = (import.meta as any)?.env?.VITE_BACKEND_URL || '';
      const url = baseUrl ? `${baseUrl}/api/whatsapp/send` : '/api/whatsapp/send';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: job.mobile, message: template })
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      markSent(job.customerName, job.date);
      toast({ title: 'Sent', description: 'WhatsApp report sent.' });
      setRenderTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Send failed', description: err?.message || 'Could not send', variant: 'destructive' });
    }
  };
  // Ensure jobs is always an array
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  if (safeJobs.length === 0) {
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
            {safeJobs.map((job, index) => {
              const alreadySent = isSent(job.customerName, job.date);
              return (
            <TableRow key={index} className={`hover:bg-muted/50 ${alreadySent ? 'dark:bg-green-950/20' : ''}`} data-testid={`job-row-${index}`}>
                <TableCell className="whitespace-nowrap" data-testid={`job-date-${index}`}>
                  {formatDate(job.date)}
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${alreadySent ? 'text-green-700 dark:text-green-300' : ''}`} data-testid={`job-customer-${index}`}>
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
                  ****
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
                    {/* Receipt button removed */}
                    {!alreadySent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendWhatsApp(job)}
                        data-testid={`button-send-whatsapp-${index}`}
                        title="Send report on WhatsApp"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
