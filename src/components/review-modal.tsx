
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  vehicleName: string;
}

const StarRatingInput = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
    const [hoverRating, setHoverRating] = React.useState(0);
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                return (
                    <button
                        type="button"
                        key={i}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                    >
                        <Star className={cn(
                            'h-8 w-8 transition-colors',
                            starValue <= (hoverRating || rating) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-muted-foreground'
                        )} />
                    </button>
                )
            })}
        </div>
    )
}

export default function ReviewModal({ isOpen, onClose, onSubmit, vehicleName }: ReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        toast({ variant: 'destructive', title: 'Calificación requerida', description: 'Por favor, selecciona una calificación de estrellas.' });
        return;
    }
    if (!comment) {
        toast({ variant: 'destructive', title: 'Comentario requerido', description: 'Por favor, escribe un comentario.' });
        return;
    }
    setIsSubmitting(true);
    await onSubmit(rating, comment);
    setIsSubmitting(false);
  };
  
  React.useEffect(() => {
    if (!isOpen) {
        setRating(0);
        setComment('');
        setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deja tu reseña para {vehicleName}</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar y a otros clientes a elegir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <Label>Tu calificación</Label>
                <StarRatingInput rating={rating} setRating={setRating} />
            </div>
            <div>
                <Label htmlFor="comment">Tu comentario</Label>
                <Textarea 
                    id="comment" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="¿Qué te pareció el vehículo y el servicio?"
                    rows={5}
                />
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Reseña
              </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

