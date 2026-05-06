import { Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AssetCategoryFilter = 'all' | 'image' | 'video' | 'file';
export type AssetSort = 'recent' | 'oldest' | 'name' | 'size';

interface AssetToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  filter: AssetCategoryFilter;
  onFilterChange: (next: AssetCategoryFilter) => void;
  sort: AssetSort;
  onSortChange: (next: AssetSort) => void;
  onUploadClick: () => void;
  total: number;
}

export function AssetToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onUploadClick,
  total,
}: AssetToolbarProps) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='relative min-w-[180px] flex-1'>
        <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          placeholder='Search assets'
          className='pl-8'
        />
      </div>

      <Select
        value={filter}
        onValueChange={(v) => onFilterChange(v as AssetCategoryFilter)}>
        <SelectTrigger className='min-w-[140px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All ({total})</SelectItem>
          <SelectItem value='image'>Images</SelectItem>
          <SelectItem value='video'>Videos</SelectItem>
          <SelectItem value='file'>Files</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as AssetSort)}>
        <SelectTrigger className='min-w-[140px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='recent'>Newest first</SelectItem>
          <SelectItem value='oldest'>Oldest first</SelectItem>
          <SelectItem value='name'>Name (A→Z)</SelectItem>
          <SelectItem value='size'>Largest first</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={onUploadClick}>
        <Upload className='size-4' />
        Upload
      </Button>
    </div>
  );
}
