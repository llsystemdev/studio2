
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

interface VehicleImageCarouselProps {
    imageUrls: string[];
    altText: string;
    dataAiHint?: string;
}

export default function VehicleImageCarousel({ imageUrls, altText, dataAiHint }: VehicleImageCarouselProps) {
    return (
        <Carousel className="w-full">
            <CarouselContent>
                {imageUrls && imageUrls.length > 0 ? (
                    imageUrls.map((url, index) => (
                        <CarouselItem key={index}>
                             <Card className="overflow-hidden border h-full w-full relative aspect-video">
                                <Image
                                    src={url}
                                    alt={`${altText} image ${index + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                    data-ai-hint={dataAiHint}
                                    priority={index === 0}
                                />
                            </Card>
                        </CarouselItem>
                    ))
                ) : (
                    <CarouselItem>
                        <Card className="overflow-hidden border h-full w-full relative aspect-video">
                            <Image
                                src={'https://placehold.co/800x600.png'}
                                alt={altText}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                data-ai-hint="placeholder"
                                priority
                            />
                        </Card>
                    </CarouselItem>
                )}
            </CarouselContent>
            <CarouselPrevious className="ml-14" />
            <CarouselNext className="mr-14" />
        </Carousel>
    );
}
