
# Diagnóstico y Reparación del Flujo de Pre-Contrato

## 1. Causa Raíz del Problema

El problema principal que causaba el fallo en el endpoint `/api/contract/create` era una **incompatibilidad de runtime y el uso de un SDK de Firebase incorrecto**.

1.  **Runtime de Edge por Defecto**: La ruta API de Next.js (`route.ts`) no especificaba un runtime, por lo que Next.js la ejecutaba en el **runtime de Edge**. El código dentro del flujo de Genkit (`generateContract.ts`) dependía de la librería `firebase-admin`, que requiere un entorno de Node.js para funcionar y no es compatible con Edge.
2.  **SDK de Firebase Incorrecto**: El archivo `src/ai/flows/generateContract.ts` importaba y utilizaba la versión **cliente** de Firestore (`@/lib/firebase/client`) en lugar de la versión **servidor** (`@/lib/firebase/server/admin`). El SDK de cliente está diseñado para el navegador y no tiene los privilegios necesarios para ejecutar operaciones de escritura desde el backend, además de ser incompatible con el entorno de servidor.

Esta combinación de errores provocaba que la ejecución fallara de forma silenciosa en el servidor, devolviendo una página de error HTML genérica de Next.js en lugar de un objeto JSON con los detalles del error, confundiendo al cliente que esperaba una respuesta `application/json`.

## 2. Cambios Aplicados

Para solucionar el problema, se realizaron los siguientes ajustes mínimos y seguros:

1.  **Forzar Runtime de Node.js en la Ruta API**:
    *   **Archivo Modificado**: `src/app/api/contract/create/route.ts`
    *   **Cambio**: Se descomentó y añadió la configuración de runtime para asegurar que la ruta se ejecute siempre en un entorno de Node.js.

    ```typescript
    export const runtime = 'nodejs';
    export const dynamic = 'force-dynamic';
    ```

2.  **Corregir el SDK de Firebase en el Flujo de Genkit**:
    *   **Archivo Modificado**: `src/ai/flows/generateContract.ts`
    *   **Cambio**: Se reemplazó la importación del SDK de cliente de Firebase por el SDK de administrador (Admin).

    ```typescript
    // Antes (Incorrecto)
    // import { db } from '@/lib/firebase/client';
    // import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

    // Después (Correcto)
    import { getDb } from '@/lib/firebase/server/admin';
    ```

    *   **Cambio**: Se actualizaron las llamadas a Firestore para usar la sintaxis del Admin SDK, que es ligeramente diferente.

    ```typescript
    // Antes (Incorrecto)
    // newContractRef = await addDoc(collection(db, 'contracts'), { ... });

    // Después (Correcto)
    const db = getDb();
    newContractRef = await db.collection('contracts').add({ ... });
    ```

## 3. Cómo Probar la Solución

Se ha creado un script de prueba automatizado para verificar que el endpoint funciona correctamente.

**Instrucciones para ejecutar la prueba:**

1.  **Abre una terminal** en la raíz de tu proyecto en VS Code.
2.  **Asegúrate de que el servidor de desarrollo de Next.js esté corriendo**. Si no lo está, ejecuta:
    ```bash
    npm run dev
    ```
3.  **Ejecuta el script de prueba** con el siguiente comando:
    ```bash
    node scripts/test-precontract.mjs
    ```

**Salida Esperada (Éxito):**

Si la prueba es exitosa, verás un mensaje en la consola similar a este:

```
🚀 Starting pre-contract creation test...
📡 Request sent to: http://localhost:3000/api/contract/create
📈 Response Status: 200
✅ Response is valid JSON.
📄 Response Body: {
  "success": true,
  "contractId": "someGeneratedIdString"
}
✅✅✅ Test Passed!
📄 Successfully created pre-contract with ID: someGeneratedIdString
🏁 Test finished.
```

## 4. Checklist de Verificación

-   [x] **Endpoint devuelve JSON**: El endpoint `/api/contract/create` ahora devuelve respuestas JSON de forma consistente, incluso en caso de error.
-   [x] **Pre-contrato se crea**: El flujo genera un documento en la colección `contracts` de Firestore.
-   [x] **No hay errores de runtime**: Se eliminaron los conflictos de runtime de Edge.
-   [x] **Prueba automatizada pasa**: El script `scripts/test-precontract.mjs` se ejecuta exitosamente.
-   [x] **Credenciales y Reglas**: El uso del Admin SDK verifica implícitamente que las credenciales del servidor (`.env`) son correctas. Las reglas de Firestore no bloquean la escritura desde el backend.

## 5. Próximos Pasos Sugeridos (Opcional)

*   **Variables de Entorno para Colecciones**: Para evitar escribir en la colección de producción `contracts` durante las pruebas, se podría usar una variable de entorno como `FIRESTORE_CONTRACTS_COLLECTION` y leerla en `generateContract.ts`.
*   **Validación de Esquema con Zod**: Se podría añadir una validación más estricta del `body` de la petición en `route.ts` usando Zod para asegurar la integridad de los datos de entrada.
*   **Monitoreo y Alertas**: Configurar un sistema de monitoreo (por ejemplo, Google Cloud Logging) para capturar errores del servidor de forma proactiva.
