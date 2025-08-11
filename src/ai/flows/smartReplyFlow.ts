
'use server';
/**
 * @fileOverview An AI agent for generating contextual customer service replies.
 * - generateSmartReply - Handles the smart reply generation process.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Reservation, Vehicle } from '@/lib/types';
import knowledgeBaseData from '@/ai/knowledgeBase.json';

export const SmartReplyInputSchema = z.object({
  customerName: z.string().describe("The customer's name."),
  vehicleModel: z.string().describe('The vehicle model.'),
  pickupDate: z.string().describe('The pickup date of the reservation.'),
  dropoffDate: z.string().describe('The drop-off date of the reservation.'),
  reservationStatus: z.string().describe('The current status of the reservation (e.g., Upcoming, Active).'),
  pricePerDay: z.number().describe('The daily rental price of the vehicle.'),
  customerQuery: z.string().describe("The customer's original question or message."),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

export const SmartReplyOutputSchema = z.object({
  replyText: z.string().describe('The generated, professional, and helpful reply to the customer.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReply(reservation: Reservation, vehicle: Vehicle, customerQuery: string): Promise<SmartReplyOutput> {
    const input: SmartReplyInput = {
        customerName: reservation.customerName,
        vehicleModel: `${vehicle.make} ${vehicle.model}`,
        pickupDate: reservation.pickupDate,
        dropoffDate: reservation.dropoffDate,
        reservationStatus: reservation.status,
        pricePerDay: vehicle.pricePerDay,
        customerQuery: customerQuery,
    };

    const reply = await smartReplyFlow(input);
    if (!reply) {
      throw new Error('The AI model failed to generate a reply.');
    }
    return reply;
}

const knowledgeBase = `
**Políticas de Alquiler de Virtus Car Rental:**
${knowledgeBaseData.policies.map(policy => `- **${policy.name}:** ${policy.description}`).join('\n      ')}
`;

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: { schema: SmartReplyInputSchema },
  output: { schema: SmartReplyOutputSchema },
  prompt: `
    Eres un agente de servicio al cliente para "Virtus Car Rental". Eres extremadamente profesional, amable y servicial.
    Tu tarea es generar una respuesta clara y concisa a la consulta de un cliente.

    Utiliza la siguiente BASE DE CONOCIMIENTO para responder preguntas sobre políticas:
    ${knowledgeBase}

    Aquí está el CONTEXTO DE LA RESERVA ACTUAL:
    - Cliente: {{customerName}}
    - Vehículo: {{vehicleModel}}
    - Precio por día: ${{pricePerDay}} USD
    - Periodo: {{pickupDate}} a {{dropoffDate}}
    - Estado: {{reservationStatus}}

    Esta es la CONSULTA DEL CLIENTE:
    "{{{customerQuery}}}"

    Instrucciones para la respuesta:
    1. Dirígete al cliente por su nombre (Ej: "Estimado/a {{customerName}},").
    2. Responde directamente a su pregunta de forma clara.
    3. Si la pregunta es sobre costos, calcula los montos basándote en el precio por día.
    4. Mantén un tono profesional y amigable.
    5. Finaliza la respuesta de manera cortés (Ej: "Quedamos a su disposición para cualquier otra consulta.").
    6. No inventes políticas. Si la respuesta no está en la base de conocimiento, indica que necesitarás verificar la información con un supervisor y que te comunicarás de nuevo.
    7. La respuesta debe ser solo el texto para el cliente, sin introducciones como "Aquí está la respuesta:".

    Genera la respuesta ahora.
  `,
   config: {
        model: 'gemini-1.5-flash-latest',
        temperature: 0.3,
    }
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async (input: SmartReplyInput) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to generate a smart reply.');
    }
    return output;
  }
);
