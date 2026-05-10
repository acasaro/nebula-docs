import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreFooterProps {
  onLoadMore: () => void;
  loading: boolean;
}

export function LoadMoreFooter({ onLoadMore, loading }: LoadMoreFooterProps) {
  return (
    <div className='flex items-center justify-center border-t border-border/60 bg-muted/20 px-4 py-2'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onLoadMore}
        disabled={loading}
        className='text-muted-foreground hover:text-foreground'
      >
        {loading ? (
          <>
            <Loader2 className='size-3.5 animate-spin' />
            Loading…
          </>
        ) : (
          "Load more"
        )}
      </Button>
    </div>
  );
}
