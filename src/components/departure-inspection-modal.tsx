
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Camera, Car, Fuel, Milestone, StickyNote, PenSquare } from 'lucide-react';
import type { Reservation, VehicleInspection } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface DepartureInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  reservation: Reservation | null;
  inspectionType: 'departure' | 'return';
}

const PhotoUploadSlot = ({ id, label, onFileChange, previewUrl, isViewing }: { id: string, label: string, onFileChange: (file: File | null) => void, previewUrl: string | null, isViewing: boolean }) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-center block">{label}</Label>
        <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center relative bg-muted/40">
            {previewUrl ? (
                <Image src={previewUrl} alt={`${label} preview`} layout="fill" className="object-cover rounded-md" />
            ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
            )}
            {!isViewing && (
                <Input 
                    id={id} 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
                />
            )}
        </div>
    </div>
);

const InspectionDetailsView = ({ title, inspection }: { title: string, inspection: VehicleInspection }) => (
    <div className="space-y-4">
        <h4 className="font-semibold text-lg">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inspection.photos.map((photo, index) => (
                 <div key={index} className="relative aspect-video">
                    <Image src={photo} alt={`${title} photo ${index + 1}`} layout="fill" className="object-cover rounded-md" />
                </div>
            ))}
        </div>
         <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Kilometraje:</strong> {inspection.mileage} km</p>
            <p><strong>Combustible:</strong> {inspection.fuelLevel}</p>
        </div>
        {inspection.notes && <p className="text-sm"><strong>Notas:</strong> {inspection.notes}</p>}
        {inspection.signatureUrl && (
            <div>
                 <p className="text-sm font-semibold">Firma:</p>
                 <div className="relative h-24 border rounded-md bg-gray-100">
                    <Image src={inspection.signatureUrl} alt="Firma" layout="fill" className="object-contain p-2" />
                 </div>
            </div>
        )}
    </div>
);


export default function DepartureInspectionModal({ isOpen, onClose, onSubmit, reservation, inspectionType }: DepartureInspectionModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mileage, setMileage] = React.useState('');
  const [fuelLevel, setFuelLevel] = React.useState('Full');
  const [notes, setNotes] = React.useState('');
  const [photos, setPhotos] = React.useState<{ [key: string]: File | null }>({
    front: null, right: null, back: null, left: null
  });
  const [previews, setPreviews] = React.useState<{ [key: string]: string | null }>({
    front: null, right: null, back: null, left: null
  });
  const [signature, setSignature] = React.useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>(null);
  const { toast } = useToast();
  
  const isViewing = (inspectionType === 'departure' && !!reservation?.departureInspection) || 
                    (inspectionType === 'return' && !!reservation?.returnInspection);

  React.useEffect(() => {
    if (isViewing && reservation) {
        const inspectionData = inspectionType === 'departure' ? reservation.departureInspection : reservation.returnInspection;
        if (inspectionData) {
            setMileage(String(inspectionData.mileage));
            setFuelLevel(inspectionData.fuelLevel);
            setNotes(inspectionData.notes);
            setPreviews({
                front: inspectionData.photos[0] || null,
                right: inspectionData.photos[1] || null,
                back: inspectionData.photos[2] || null,
                left: inspectionData.photos[3] || null,
            });
            setSignaturePreview(inspectionData.signatureUrl || null);
        }
    } else {
        // Reset form for new entry
        setMileage('');
        setFuelLevel('Full');
        setNotes('');
        setPhotos({ front: null, right: null, back: null, left: null });
        setPreviews({ front: null, right: null, back: null, left: null });
        setSignature(null);
        setSignaturePreview(null);
    }
  }, [isOpen, isViewing, reservation, inspectionType]);

  const handleFileChange = (id: string) => (file: File | null) => {
    setPhotos(prev => ({ ...prev, [id]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [id]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({ ...prev, [id]: null }));
    }
  };
  
  const handleSignatureChange = (file: File | null) => {
    setSignature(file);
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setSignaturePreview(reader.result as string);
        reader.readAsDataURL(file);
    } else {
        setSignaturePreview(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const photoFiles = Object.values(photos).filter((p): p is File => p !== null);

    if (!isViewing && photoFiles.length < 4) {
        toast({
            variant: 'destructive',
            title: 'Fotos Incompletas',
            description: 'Por favor, suba las 4 fotos del vehículo.'
        });
        return;
    }
    
    setIsSubmitting(true);
    await onSubmit({ mileage, fuelLevel, notes, photos: photoFiles, signature });
    setIsSubmitting(false);
  };
  
  if (!reservation) return null;

  const renderInspectionForm = () => (
    <>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="mileage" className="flex items-center gap-2 mb-2"><Milestone className="h-4 w-4"/> Kilometraje</Label>
                        <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required disabled={isViewing}/>
                    </div>
                    <div>
                         <Label className="flex items-center gap-2 mb-2"><Fuel className="h-4 w-4"/> Nivel de Combustible</Label>
                         <RadioGroup value={fuelLevel} onValueChange={setFuelLevel} className="flex space-x-2" disabled={isViewing}>
                           {['Full', '3/4', '1/2', '1/4', 'Empty'].map(level => (
                             <div key={level} className="flex items-center space-x-1">
                               <RadioGroupItem value={level} id={`fuel-${level}`} />
                               <Label htmlFor={`fuel-${level}`} className="text-xs">{level}</Label>
                             </div>
                           ))}
                         </RadioGroup>
                    </div>
                </div>
                
                 <div>
                    <Label htmlFor="notes" className="flex items-center gap-2 mb-2"><StickyNote className="h-4 w-4"/>Notas Adicionales</Label>
                    <Textarea id="notes" placeholder="Ej: Rayón leve en puerta trasera derecha..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} disabled={isViewing}/>
                </div>

                 <div>
                    <Label htmlFor="signature" className="flex items-center gap-2 mb-2"><PenSquare className="h-4 w-4"/>Firma del Cliente</Label>
                     <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center relative bg-muted/40">
                        {signaturePreview ? (
                            <Image src={signaturePreview} alt="Signature preview" layout="fill" className="object-contain p-2" />
                        ) : (
                             <p className="text-muted-foreground text-sm">Subir o tomar foto de la firma</p>
                        )}
                        {!isViewing && (
                           <Input 
                            id="signature" 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleSignatureChange(e.target.files ? e.target.files[0] : null)}
                           />
                        )}
                    </div>
                </div>

             </div>

             <div className="space-y-4">
                <Label className="flex items-center gap-2"><Camera className="h-4 w-4"/>Fotos del Vehículo</Label>
                <div className="grid grid-cols-2 gap-4">
                    <PhotoUploadSlot id="front" label="Frente" onFileChange={handleFileChange('front')} previewUrl={previews.front} isViewing={isViewing}/>
                    <PhotoUploadSlot id="right" label="Lado Derecho" onFileChange={handleFileChange('right')} previewUrl={previews.right} isViewing={isViewing}/>
                    <PhotoUploadSlot id="back" label="Atrás" onFileChange={handleFileChange('back')} previewUrl={previews.back} isViewing={isViewing}/>
                    <PhotoUploadSlot id="left" label="Lado Izquierdo" onFileChange={handleFileChange('left')} previewUrl={previews.left} isViewing={isViewing}/>
                </div>
             </div>
          </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isViewing ? 'Detalles de Inspección' : `Inspección de ${inspectionType === 'departure' ? 'Salida' : 'Devolución'}`}</DialogTitle>
          <DialogDescription>
             {isViewing ? `Viendo las inspecciones para la reserva ${reservation.id}.` : `Complete los detalles para la reserva ${reservation.id}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
          
          {isViewing ? (
              <div className="space-y-6">
                  {reservation.departureInspection && <InspectionDetailsView title="Inspección de Salida" inspection={reservation.departureInspection} />}
                  {reservation.departureInspection && reservation.returnInspection && <Separator />}
                  {reservation.returnInspection && <InspectionDetailsView title="Inspección de Devolución" inspection={reservation.returnInspection} />}
              </div>
          ) : (
            renderInspectionForm()
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                {isViewing ? 'Cerrar' : 'Cancelar'}
              </Button>
            </DialogClose>
            {!isViewing && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Completar Inspección
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
