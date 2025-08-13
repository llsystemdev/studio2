
'use server';
/**
 * @fileOverview A legal contract generation AI agent.
 *
 * - generateContract - A function that handles the contract generation process.
 * - GenerateContractInput - The input type for the generateContract function.
 * - GenerateContractOutput - The return type for the generateContract function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
// Corrected import: Use the server-side admin SDK for Firestore operations.
import { getDb } from '@/lib/firebase/server/admin';
import { differenceInCalendarDays } from 'date-fns';
import type { Reservation, Vehicle } from '@/lib/types';
import { prompt } from '@genkit-ai/ai';
import { flow } from '@genkit-ai/core';

export const GenerateContractInputSchema = z.object({
  clientName: z.string(),
  clientID: z.string(),
  vehicleModel: z.string(),
  vehiclePlate: z.string(),
  rentalDays: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  totalPrice: z.number(),
  language: z.enum(['en', 'es']),
});
export type GenerateContractInput = z.infer<typeof GenerateContractInputSchema>;


const GenerateContractOutputSchema = z.object({
  contractText: z.string(),
});
export type GenerateContractOutput = z.infer<typeof GenerateContractOutputSchema>;


export async function generateContract(
    reservation: Reservation,
    vehicle: Vehicle,
    language: 'en' | 'es' = 'es',
    customerData?: { name: string; email: string; phone: string }
): Promise<string> {
    const pickupDate = new Date(reservation.pickupDate);
    const dropoffDate = new Date(reservation.dropoffDate);
    const rentalDays = differenceInCalendarDays(dropoffDate, pickupDate) || 1;

    let contractResult;
    try {
        contractResult = await contractFlow({
            clientName: reservation.customerName,
            clientID: reservation.customerId || 'PENDIENTE', 
            vehicleModel: `${vehicle.make} ${vehicle.model}`,
            vehiclePlate: vehicle.plate,
            rentalDays: rentalDays,
            startDate: reservation.pickupDate,
            endDate: reservation.dropoffDate,
            totalPrice: reservation.totalCost || 0,
            language: language,
        });
    } catch (error) {
        console.error("Error generating contract with AI model:", error);
        throw new Error('Failed to generate contract. Please try again.');
    }

    if (!contractResult) {
      throw new Error('The AI model failed to generate a contract.');
    }

    const db = getDb(); // Get the Firestore admin instance.
    let newContractRef;
    try {
        // Corrected Firestore call: Use the admin SDK syntax.
        newContractRef = await db.collection('contracts').add({
            reservationId: reservation.id || '', // Can be empty for pre-contracts
            customerId: reservation.customerId || '', // Can be empty for pre-contracts
            customerName: reservation.customerName,
            customerEmail: customerData?.email || '',
            customerPhone: customerData?.phone || '',
            vehicleId: reservation.vehicleId,
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            pickupDate: reservation.pickupDate,
            dropoffDate: reservation.dropoffDate,
            totalCost: reservation.totalCost || 0,
            status: 'pending_signature',
            createdAt: new Date().toISOString(),
            content: contractResult.contractText,
        });
    } catch (error) {
        console.error("Error saving contract to Firestore:", error);
        throw new Error('Failed to save contract. Please try again.');
    }

    if (reservation.id) {
        try {
            // Corrected Firestore call: Use the admin SDK syntax.
            const reservationRef = db.collection('reservations').doc(reservation.id);
            await reservationRef.update({
                contractId: newContractRef.id
            });
        } catch (error) {
            console.error("Error updating reservation with contract ID:", error);
        }
    }
    
    return newContractRef.id;
}


const contractPrompt = prompt({
    name: 'generateContractPrompt',
    input: { schema: GenerateContractInputSchema },
    output: { schema: GenerateContractOutputSchema },
    prompt: `
        You are an expert legal AI assistant that generates personalized car rental contracts in {{language}}.

        Generate a full, professional, and legally sound contract for the following rental.
        The response MUST be only the text of the contract, with no additional formatting like Markdown or HTML.

        **Rental Details:**
        - **Client Name:** {{clientName}}
        - **Client ID:** {{clientID}}
        - **Vehicle:** {{vehicleModel}} (Plate: {{vehiclePlate}})
        - **Rental Duration:** {{rentalDays}} days
        - **Start Date:** {{startDate}}
        - **End Date:** {{endDate}}
        - **Total Price:** ${{totalPrice}} USD

        **Contract Sections to Include:**
        1.  **Parties Involved:** Clearly state "Virtus Car Rental S.R.L." as the lessor and the client's name as the lessee.
        2.  **Vehicle Description:** Detail the vehicle being rented.
        3.  **Rental Period:** Specify the start and end dates.
        4.  **Financial Terms:** State the total price and payment conditions.
        5.  **Terms and Conditions:** Include professional clauses covering:
            - Renter's responsibilities (fuel, traffic violations, proper use).
            - Lessor's responsibilities (providing a vehicle in good condition).
            - A specific clause for damages, accidents, and theft, mentioning the deductible.
            - Conditions for late returns.
        6.  **Signatures:** Provide placeholders for the Renter, an optional Additional Driver, and a representative of "Virtus Car Rental S.R.L.".
        7.  **Governing Law:** Mention that the contract is governed by the laws of the Dominican Republic.

        Generate the contract text now.
    `,
    config: {
        model: 'gemini-1.5-flash-latest',
        temperature: 0.5,
    }
});


const contractFlow = flow(
  {
    name: 'generateContractFlow',
    inputSchema: GenerateContractInputSchema,
    outputSchema: GenerateContractOutputSchema,
  },
  async (input: GenerateContractInput) => {
    const { output } = await contractPrompt(input);
    if (!output) {
      throw new Error('The AI model failed to generate a contract output.');
    }
    return output;
  }
);
