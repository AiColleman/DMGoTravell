import React, { useState } from 'react';
import { resolveMediaUrl } from '../../lib/mediaCatalog';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  category?: 'tour' | 'package' | 'hotel' | 'room' | 'mobility';
  seedIndex?: number;
  className?: string;
}

const UNSPLASH_BACKUP: Record<string, string> = {
  tour: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=1200&q=80',
  package: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  room: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  mobility: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
};

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  category = 'tour',
  seedIndex = 0,
  className = '',
}) => {
  const primaryResolved = resolveMediaUrl(src, category, seedIndex);
  const [currentSrc, setCurrentSrc] = useState<string>(primaryResolved);
  const [usedBackup, setUsedBackup] = useState<boolean>(false);

  React.useEffect(() => {
    setCurrentSrc(resolveMediaUrl(src, category, seedIndex));
    setUsedBackup(false);
  }, [src, category, seedIndex]);

  const handleError = () => {
    if (!usedBackup) {
      setUsedBackup(true);
      setCurrentSrc(UNSPLASH_BACKUP[category] ?? UNSPLASH_BACKUP.tour);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={className}
    />
  );
};
