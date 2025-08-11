
'use server';

import { generateContract as generateContractFlow } from '@/ai/flows/generateContract';
import { generateChecklist } from '@/ai/flows/generateChecklist';
import { generateSmartReply } from '@/ai/flows/smartReplyFlow';
import type { Reservation, Vehicle } from '@/lib/types';

/**
 * Generates a legal rental contract using an AI flow and saves it to Firestore.
 * This is a server action wrapper around the actual Genkit flow.
 * @param reservation The reservation object.
 * @param vehicle The vehicle object associated with the reservation.
 * @param language The language for the contract.
 * @param customerData Optional customer data for pre-contracts.
 * @returns The ID of the newly created document in Firestore.
 */
export async function runGenerateContract(
    reservation: Reservation,
    vehicle: Vehicle,
    language: 'es' | 'en' = 'es',
    customerData?: { name: string; email: string; phone: string }
) {
    if (!reservation || !vehicle) {
        throw new Error('Reservation and Vehicle data are required.');
    }

    try {
        const contractId = await generateContractFlow(reservation, vehicle, language, customerData);
        return contractId;
    } catch (error) {
        console.error('Error in server action for generating contract:', error);
        throw new Error('Failed to run AI contract generation flow.');
    }
}


/**
 * Generates a vehicle inspection checklist using an AI flow and saves it to Firestore.
 * This is a server action wrapper around the actual Genkit flow.
 * @param reservation The reservation object.
 * @param vehicle The vehicle object associated with the reservation.
 * @returns The ID of the newly created document in Firestore.
 */
export async function runGenerateChecklist(reservation: Reservation, vehicle: Vehicle) {
    if (!reservation || !vehicle) {
        throw new Error('Reservation and Vehicle data are required.');
    }

    try {
        const checklistId = await generateChecklist(reservation, vehicle);
        return checklistId;
    } catch (error) {
        console.error('Error in server action for generating checklist:', error);
        throw new Error('Failed to run AI checklist generation flow.');
    }
}

/**
 * Generates a contextual reply to a customer query using an AI flow.
 * @param reservation The reservation to use as context.
 * @param vehicle The vehicle to use as context.
 * @param customerQuery The customer's question.
 * @returns The AI-generated reply as a string.
 */
export async function runSmartReply(reservation: Reservation, vehicle: Vehicle, customerQuery: string) {
    if (!reservation || !vehicle || !customerQuery) {
        throw new Error('Reservation, Vehicle, and a customer query are required.');
    }

    try {
        const reply = await generateSmartReply(reservation, vehicle, customerQuery);
        return reply.replyText;
    } catch (error) {
        console.error('Error in server action for smart reply:', error);
        throw new Error('Failed to run AI smart reply flow.');
    }
}
