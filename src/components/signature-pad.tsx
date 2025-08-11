
'use client';

import * as React from 'react';

const SignaturePad = React.forwardRef<
    { getSignature: () => Blob | null; clear: () => void },
    {}
>((props, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    const getContext = () => canvasRef.current?.getContext('2d');

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.scale(ratio, ratio);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        const ctx = getContext();
        if (ctx) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
        }

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getContext();
        if (ctx) {
            ctx.closePath();
        }
        setIsDrawing(false);
    };
    
    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if(canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    const getSignature = (): Promise<Blob | null> => {
        const canvas = canvasRef.current;
        if (!canvas) return Promise.resolve(null);

        // Check if canvas is empty
        const context = getContext();
        if (context) {
            const pixelBuffer = new Uint32Array(
                context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            if (!pixelBuffer.some(color => color !== 0)) {
                return Promise.resolve(null); // Is empty
            }
        }
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    };
    
    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
        getSignature,
        clear
    }));

    return (
        <canvas
            ref={canvasRef}
            className="w-full aspect-video border rounded-md bg-white cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
});
SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
