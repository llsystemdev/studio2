
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Cargando su Pre-Contrato...</h1>
        <p className="text-muted-foreground">
          Por favor espere un momento mientras preparamos su documento.
        </p>
      </div>
    </div>
  );
}
