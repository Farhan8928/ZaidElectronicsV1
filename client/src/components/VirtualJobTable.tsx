import { GoogleSheetsJob } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Receipt } from "lucide-react";
import { useMemo, useState, useCallback } from "react";

interface VirtualJobTableProps {
  jobs: GoogleSheetsJob[];
  onEdit: (job: GoogleSheetsJob, index: number) => void;
  onDelete: (index: number) => void;
  onGenerateReceipt: (job: GoogleSheetsJob) => void;
  itemHeight?: number;
  containerHeight?: number;
}

// Utility function to format date without time
const formatDate = (dateString: string): string => {
  try {
    // Handle empty or null dates
    if (!dateString || dateString.trim() === '') {
      return 'No Date';
    }
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's in ISO format with time, extract just the date part
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      
      // Check if this is a timezone issue where the date is off by one day
      // If the time is 18:30:00.000Z (6:30 PM UTC), it might be the next day in local time
      const timePart = dateString.split('T')[1];
      if (timePart && timePart.includes('18:30:00.000Z')) {
        // This suggests the date might be off by one day due to timezone conversion
        // Let's add one day to compensate
        const date = new Date(datePart + 'T00:00:00.000Z');
        date.setUTCDate(date.getUTCDate() + 1);
        return date.toISOString().split('T')[0];
      }
      
      return datePart;
    }
    
    // For other formats, try to parse and format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }
    
    // Use UTC methods to avoid timezone conversion issues
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateString || 'No Date'; // Return original string if error, or 'No Date' if empty
  }
};

export function VirtualJobTable({ 
  jobs, 
  onEdit, 
  onDelete, 
  onGenerateReceipt,
  itemHeight = 60,
  containerHeight = 600
}: VirtualJobTableProps) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      jobs.length
    );
    
    return {
      startIndex,
      endIndex,
      items: jobs.slice(startIndex, endIndex)
    };
  }, [jobs, scrollTop, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (jobs.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center" data-testid="empty-jobs">
        <p className="text-muted-foreground">No jobs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Virtual spacer for items before visible range */}
        <div style={{ height: visibleItems.startIndex * itemHeight }} />
        
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
            {visibleItems.items.map((job, index) => {
              const actualIndex = visibleItems.startIndex + index;
              return (
                <TableRow 
                  key={actualIndex} 
                  className="hover:bg-muted/50" 
                  data-testid={`job-row-${actualIndex}`}
                  style={{ height: itemHeight }}
                >
                  <TableCell className="whitespace-nowrap" data-testid={`job-date-${actualIndex}`}>
                    {formatDate(job.date)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium" data-testid={`job-customer-${actualIndex}`}>
                      {job.customerName}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap" data-testid={`job-mobile-${actualIndex}`}>
                    {job.mobile}
                  </TableCell>
                  <TableCell data-testid={`job-tv-model-${actualIndex}`}>
                    {job.tvModel}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" data-testid={`job-work-done-${actualIndex}`}>
                    {job.workDone}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium" data-testid={`job-price-${actualIndex}`}>
                    ₹{job.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap" data-testid={`job-parts-cost-${actualIndex}`}>
                    ₹{(job.partsCost || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-green-600" data-testid={`job-profit-${actualIndex}`}>
                    ₹{job.profit.toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(job, actualIndex)}
                        data-testid={`button-edit-${actualIndex}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(actualIndex)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${actualIndex}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onGenerateReceipt(job)}
                        data-testid={`button-receipt-${actualIndex}`}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Virtual spacer for items after visible range */}
        <div style={{ height: (jobs.length - visibleItems.endIndex) * itemHeight }} />
      </div>
    </div>
  );
}
