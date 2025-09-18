import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema, GoogleSheetsJob } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { useState, useEffect } from "react";

interface JobFormProps {
  onSubmit: (job: GoogleSheetsJob) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<GoogleSheetsJob>;
}

export function JobForm({ onSubmit, onCancel, loading, initialData }: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<GoogleSheetsJob>({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      customerName: initialData?.customerName || "",
      mobile: initialData?.mobile || "",
      tvModel: initialData?.tvModel || "",
      workDone: initialData?.workDone || "",
      price: initialData?.price || 0,
      partsCost: initialData?.partsCost || 0,
      profit: initialData?.profit || 0,
    }
  });

  const watchedPrice = form.watch("price");
  const watchedPartsCost = form.watch("partsCost");

  // Auto-calculate profit
  useEffect(() => {
    const price = watchedPrice || 0;
    const partsCost = watchedPartsCost || 0;
    const profit = price - partsCost;
    form.setValue("profit", profit);
  }, [watchedPrice, watchedPartsCost, form]);

  const handleSubmit = async (data: GoogleSheetsJob) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...form.register("date")}
          data-testid="input-date"
        />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            placeholder="Enter customer name"
            {...form.register("customerName")}
            data-testid="input-customer-name"
          />
          {form.formState.errors.customerName && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.customerName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="Enter mobile number"
            {...form.register("mobile")}
            data-testid="input-mobile"
          />
          {form.formState.errors.mobile && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.mobile.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="tvModel">TV Model / Number</Label>
        <Input
          id="tvModel"
          placeholder="e.g., Samsung 43 inch LED, Model: UA43T5300"
          {...form.register("tvModel")}
          data-testid="input-tv-model"
        />
        {form.formState.errors.tvModel && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.tvModel.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="workDone">Work Done / Issues</Label>
        <Textarea
          id="workDone"
          placeholder="Describe the work done or issues fixed..."
          className="h-24 resize-none"
          {...form.register("workDone")}
          data-testid="input-work-done"
        />
        {form.formState.errors.workDone && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.workDone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Price Charged (₹)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...form.register("price", { valueAsNumber: true })}
            data-testid="input-price"
          />
          {form.formState.errors.price && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="partsCost">Parts Cost (₹) <span className="text-muted-foreground">(Optional)</span></Label>
          <Input
            id="partsCost"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...form.register("partsCost", { valueAsNumber: true })}
            data-testid="input-parts-cost"
          />
          {form.formState.errors.partsCost && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.partsCost.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="profit">Profit (₹)</Label>
          <Input
            id="profit"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...form.register("profit", { valueAsNumber: true })}
            className="bg-muted text-muted-foreground"
            readOnly
            data-testid="input-profit"
          />
          <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
        </div>
      </div>

      <div className="flex space-x-4 pt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting || loading}
          className="flex-1"
          data-testid="button-save-job"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Job"}
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
