import type { Asset } from '@/lib/assets';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: Asset[];
  onOpen: (asset: Asset) => void;
  onCopyUrl: (asset: Asset) => void;
  onCopyMdx: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export function AssetGrid({
  assets,
  onOpen,
  onCopyUrl,
  onCopyMdx,
  onRename,
  onDelete,
}: AssetGridProps) {
  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onOpen(asset)}
          onCopyUrl={() => onCopyUrl(asset)}
          onCopyMdx={() => onCopyMdx(asset)}
          onRename={() => onRename(asset)}
          onDelete={() => onDelete(asset)}
        />
      ))}
    </div>
  );
}
