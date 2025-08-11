
'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SafeImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = 'https://placehold.co/1200x800.png';

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  alt,
  className,
  imageClassName,
  priority = false,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setImgSrc(src);
    setLoading(true);
  }, [src]);

  return (
    <div className={cn("relative w-full h-full bg-muted/20", className)}>
       {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
       )}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={cn(
            "object-cover transition-opacity duration-300",
            loading ? 'opacity-0' : 'opacity-100',
            imageClassName
        )}
        priority={priority}
        onLoad={() => setLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setLoading(false);
        }}
        unoptimized={imgSrc.includes('placehold.co')}
      />
    </div>
  );
}
