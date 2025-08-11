
'use server';
/**
 * @fileOverview An AI agent for generating vehicle inspection checklists.
 *
 * - generateChecklist - A function that generates a checklist based on vehicle type and saves it.
 * - ChecklistInput - The input type for the flow.
 * - ChecklistOutput - The return type for the flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Reservation, Vehicle } from '@/lib/types';


export const ChecklistInputSchema = z.object({
  vehicleType: z.string().describe('The category of the vehicle (e.g., SUV, Sedan, Economy).'),
  vehicleModel: z.string().describe('The specific model of the vehicle (e.g., Toyota Raize, Hyundai Accent).'),
});
export type ChecklistInput = z.infer<typeof ChecklistInputSchema>;


export const ChecklistOutputSchema = z.object({
  interior: z.array(z.string()).describe('List of items to check inside the vehicle.'),
  exterior: z.array(z.string()).describe('List of items to check on the vehicle exterior.'),
  documents: z.array(z.string()).describe('List of documents to verify.'),
  extras: z.array(z.string()).describe('List of extra or special items to check, specific to the vehicle type.'),
});
export type ChecklistOutput = z.infer<typeof ChecklistOutputSchema>;


export async function generateChecklist(reservation: Reservation, vehicle: Vehicle): Promise<string> {
    let checklistData;
    try {
        checklistData = await checklistFlow({
            vehicleType: vehicle.category,
            vehicleModel: `${vehicle.make} ${vehicle.model}`,
        });
    } catch (error) {
        console.error("Error generating checklist with AI model:", error);
        throw new Error('Failed to generate checklist. Please try again.');
    }

    if (!checklistData) {
      throw new Error('The AI model failed to generate a checklist.');
    }

    let newDocRef;
    try {
        newDocRef = await addDoc(collection(db, 'documents'), {
            customer: reservation.customerName,
            reservationId: reservation.id,
            type: 'Departure Checklist',
            date: new Date().toISOString().split('T')[0],
            status: 'Generated',
            content: JSON.stringify(checklistData, null, 2),
            fileName: `Checklist-${reservation.id}.json`,
            fileUrl: '',
        });
    } catch (error) {
        console.error("Error saving checklist to Firestore:", error);
        throw new Error('Failed to save checklist. Please try again.');
    }

    return newDocRef.id;
}


const prompt = ai.definePrompt({
  name: 'generateChecklistPrompt',
  input: { schema: ChecklistInputSchema },
  output: { schema: ChecklistOutputSchema },
  prompt: `
    You are a vehicle rental operations expert. Generate a detailed inspection checklist for a rental vehicle.
    The vehicle is a {{vehicleModel}}, which is in the {{vehicleType}} category.

    The checklist should be practical and cover all important aspects for both departure and return inspections.
    Tailor the "Extras" section to the specific vehicle type. For example, an SUV might have a 4x4 switch, while a luxury car might have advanced infotainment features.

    Generate the checklist now.
  `,
});

const checklistFlow = ai.defineFlow(
  {
    name: 'generateChecklistFlow',
    inputSchema: ChecklistInputSchema,
    outputSchema: ChecklistOutputSchema,
  },
  async (input: ChecklistInput) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to generate a checklist.');
    }
    return output;
  }
);
