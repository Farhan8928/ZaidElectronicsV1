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
      partsCost: false,
      profit: true,
    }
  });
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: () => googleSheetsService.exportToCSV(),
    onSuccess: (csvData) => {
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `zaid-electronics-jobs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Your data has been exported and downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickExport = (type: string) => {
    exportMutation.mutate();
  };

  const handleCustomExport = (e: React.FormEvent) => {
    e.preventDefault();
    exportMutation.mutate();
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
                <span className="font-medium">All Data (CSV)</span>
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
              <p className="text-sm text-muted-foreground text-left">Unique customers only</p>
            </Button>
          </div>
        </div>

        {/* Custom Export */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Custom Export</h3>
          <form onSubmit={handleCustomExport} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={customExport.fromDate}
                  onChange={(e) => setCustomExport(prev => ({ ...prev, fromDate: e.target.value }))}
                  data-testid="input-from-date"
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={customExport.toDate}
                  onChange={(e) => setCustomExport(prev => ({ ...prev, toDate: e.target.value }))}
                  data-testid="input-to-date"
                />
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
  );
}
