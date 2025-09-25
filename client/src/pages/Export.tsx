import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Users, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ReportsUtils } from "@/lib/reportsUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { format as formatDate } from "date-fns";

export default function Export() {
  const [customExport, setCustomExport] = useState({
    fromDate: "",
    toDate: "",
    format: "csv",
    includeColumns: {
      date: true,
      customerName: true,
      mobile: true,
      tvModel: true,
      workDone: true,
      price: true,
      partsCost: true,
      profit: true,
    }
  });
  const { toast } = useToast();

  const [formatPicker, setFormatPicker] = useState<{
    open: boolean;
    type: "all" | "thisMonth" | "customers" | null;
  }>({ open: false, type: null });

  const exportMutation = useMutation({
    mutationFn: async (params: { type: "all" | "thisMonth" | "customers" | "custom"; format: "csv" | "excel" | "pdf" }) => {
      const jobs = await googleSheetsService.getAllJobs();

      // Select dataset
      let rows = jobs;
      if (params.type === "thisMonth") {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        rows = jobs.filter(j => j.date.startsWith(monthKey));
      } else if (params.type === "customers") {
        // All customer rows (not unique)
        rows = jobs;
      }

      // Apply custom date range and column selection when custom
      if (params.type === "custom") {
        const from = customExport.fromDate ? new Date(customExport.fromDate) : null;
        const to = customExport.toDate ? new Date(customExport.toDate) : null;
        rows = rows.filter(j => {
          const d = new Date(j.date);
          const afterFrom = from ? d >= from : true;
          const beforeTo = to ? d <= to : true;
          return afterFrom && beforeTo;
        });
      }

      // Build columns
      const columns = Object.entries(customExport.includeColumns)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      // Ensure Parts Cost default is included
      if (!columns.includes("partsCost")) {
        // no-op; user can uncheck in custom flow; default is checked in state
      }

      // Prepare data matrix
      const headers = columns.map(c => c.replace(/([A-Z])/g, ' $1').trim());
      const data = rows.map(j => columns.map(c => (j as any)[c] ?? ""));

      const today = new Date().toISOString().split('T')[0];
      const baseName = params.type === "customers"
        ? `customers-${today}`
        : params.type === "thisMonth"
          ? `jobs-${today}-month`
          : params.type === "custom"
            ? `jobs-${today}-custom`
            : `jobs-${today}`;

      // Export by format
      if (params.format === "csv") {
        const csvRows = [headers.join(",")].concat(
          data.map(row => row.map(cell => {
            const v = String(cell ?? "");
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          }).join(","))
        );
        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${baseName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (params.format === "excel") {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${baseName}.xlsx`);
      } else if (params.format === "pdf") {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(14);
        doc.text("Zaid Electronics - Export", 14, 14);
        autoTable(doc, {
          head: [headers],
          body: data,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
          startY: 18,
        });
        doc.save(`${baseName}.pdf`);
      }

      return true;
    },
    onSuccess: () => {
      toast({ title: "Export Successful", description: "Your file has been downloaded." });
    },
    onError: (error: Error) => {
      toast({ title: "Export Failed", description: error.message || "Please try again.", variant: "destructive" });
    },
  });

  const handleQuickExport = (type: "all" | "thisMonth" | "customers") => {
    setFormatPicker({ open: true, type });
  };

  const chooseFormatAndExport = (format: "pdf" | "excel") => {
    if (!formatPicker.type) return;
    exportMutation.mutate({ type: formatPicker.type, format });
    setFormatPicker({ open: false, type: null });
  };

  const handleCustomExport = (e: React.FormEvent) => {
    e.preventDefault();
    exportMutation.mutate({ type: "custom", format: customExport.format as any });
  };

  const openGoogleSheets = () => {
    if (import.meta.env.VITE_GOOGLE_SHEETS_URL) {
      window.open(import.meta.env.VITE_GOOGLE_SHEETS_URL, '_blank');
    } else {
      toast({
        title: "Google Sheets URL not configured",
        description: "Please configure VITE_GOOGLE_SHEETS_URL in your environment variables.",
        variant: "destructive",
      });
    }
  };

  const handleColumnChange = (column: string, checked: boolean) => {
    setCustomExport(prev => ({
      ...prev,
      includeColumns: {
        ...prev.includeColumns,
        [column]: checked
      }
    }));
  };

  return (
    <>
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="title-export">Export Data</h1>
        <p className="text-muted-foreground">Download your business data for backup or external analysis.</p>
      </div>

      <div className="space-y-6">
        {/* Quick Export */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => handleQuickExport("all")}
              disabled={exportMutation.isPending}
              className="p-4 h-auto flex-col items-start space-y-2"
              variant="outline"
              data-testid="button-export-all"
            >
              <div className="flex items-center space-x-3 w-full">
                <FileText className="text-green-600 text-xl" />
                <span className="font-medium">All Data</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">Complete job database</p>
            </Button>
            
            <Button
              onClick={() => handleQuickExport("thisMonth")}
              disabled={exportMutation.isPending}
              className="p-4 h-auto flex-col items-start space-y-2"
              variant="outline"
              data-testid="button-export-month"
            >
              <div className="flex items-center space-x-3 w-full">
                <Calendar className="text-blue-600 text-xl" />
                <span className="font-medium">This Month</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">Current month jobs</p>
            </Button>
            
            <Button
              onClick={() => handleQuickExport("customers")}
              disabled={exportMutation.isPending}
              className="p-4 h-auto flex-col items-start space-y-2"
              variant="outline"
              data-testid="button-export-customers"
            >
              <div className="flex items-center space-x-3 w-full">
                <Users className="text-purple-600 text-xl" />
                <span className="font-medium">Customer List</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">All customers (every job row)</p>
            </Button>
          </div>
        </div>

        {/* Custom Export */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Custom Export</h3>
          <form onSubmit={handleCustomExport} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customExport.fromDate ? customExport.fromDate : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <DateCalendar
                      mode="single"
                      selected={customExport.fromDate ? new Date(customExport.fromDate) : undefined}
                      onSelect={(d) => {
                        const val = d ? formatDate(d, 'yyyy-MM-dd') : '';
                        setCustomExport(prev => ({ ...prev, fromDate: val }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customExport.toDate ? customExport.toDate : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <DateCalendar
                      mode="single"
                      selected={customExport.toDate ? new Date(customExport.toDate) : undefined}
                      onSelect={(d) => {
                        const val = d ? formatDate(d, 'yyyy-MM-dd') : '';
                        setCustomExport(prev => ({ ...prev, toDate: val }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <Label>Export Format</Label>
              <RadioGroup
                value={customExport.format}
                onValueChange={(value) => setCustomExport(prev => ({ ...prev, format: value }))}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel">Excel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF Report</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Column Selection */}
            <div>
              <Label>Include Columns</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.entries(customExport.includeColumns).map(([column, checked]) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={column}
                      checked={checked}
                      onCheckedChange={(checked) => handleColumnChange(column, !!checked)}
                    />
                    <Label htmlFor={column} className="text-sm capitalize">
                      {column.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={exportMutation.isPending}
              data-testid="button-custom-export"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Generating..." : "Generate Export"}
            </Button>
          </form>
        </div>

        {/* Backup Options */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Backup & Sync</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Google Sheets Backup</p>
                <p className="text-sm text-muted-foreground">All data is automatically synced with Google Sheets</p>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-sync-sheets"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Open Google Sheets</p>
                <p className="text-sm text-muted-foreground">View and manage data directly in Google Sheets</p>
              </div>
              <Button 
                variant="outline"
                onClick={openGoogleSheets}
                data-testid="button-open-sheets"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Sheets
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Dialog open={formatPicker.open} onOpenChange={(open) => setFormatPicker(prev => ({ ...prev, open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose export format</DialogTitle>
          <DialogDescription>Select PDF or Excel for this export.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => chooseFormatAndExport("pdf")}>
            PDF
          </Button>
          <Button onClick={() => chooseFormatAndExport("excel")}>
            Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
