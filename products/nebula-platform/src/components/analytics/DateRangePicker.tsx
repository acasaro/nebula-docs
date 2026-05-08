import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rangeOptionLabel, type AnalyticsRangeKey } from "@/lib/analytics";

interface DateRangePickerProps {
  value: AnalyticsRangeKey;
  onChange: (value: AnalyticsRangeKey) => void;
  /** Resolved range label (e.g. "May 1 – 8") shown in the trigger. */
  rangeLabel: string;
}

const OPTIONS: AnalyticsRangeKey[] = ["7d", "30d", "90d"];

export function DateRangePicker({ value, onChange, rangeLabel }: DateRangePickerProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsRangeKey)}>
      <SelectTrigger className='gap-2'>
        <Calendar className='size-4 text-muted-foreground' />
        <SelectValue aria-label={rangeOptionLabel(value)}>{rangeLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align='end'>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {rangeOptionLabel(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
