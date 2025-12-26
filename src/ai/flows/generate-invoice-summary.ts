'use server';

/**
 * @fileOverview Invoice summarization flow.
 *
 * This file defines a Genkit flow to extract and summarize key information from an invoice PDF.
 * It exports:
 * - `generateInvoiceSummary`: The main function to trigger the flow.
 * - `InvoiceSummaryInput`: The input type for the flow (PDF data URI).
 * - `InvoiceSummaryOutput`: The output type for the flow (summary information).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvoiceSummaryInputSchema = z.object({
  invoicePdfDataUri: z
    .string()
    .describe(
      'The invoice PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + ' Ensure the MIME type is application/pdf.'
    ),
});
export type InvoiceSummaryInput = z.infer<typeof InvoiceSummaryInputSchema>;

const InvoiceSummaryOutputSchema = z.object({
  invoiceNumber: z.string().describe('The invoice number.'),
  invoiceDate: z.string().describe('The invoice date (e.g., YYYY-MM-DD).'),
  amountDue: z.number().describe('The total amount due on the invoice.'),
  vendorName: z.string().describe('The name of the vendor.'),
  vendorAddress: z.string().describe('The address of the vendor.'),
});
export type InvoiceSummaryOutput = z.infer<typeof InvoiceSummaryOutputSchema>;

export async function generateInvoiceSummary(input: InvoiceSummaryInput): Promise<InvoiceSummaryOutput> {
  return generateInvoiceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'invoiceSummaryPrompt',
  input: {schema: InvoiceSummaryInputSchema},
  output: {schema: InvoiceSummaryOutputSchema},
  prompt: `You are an expert financial assistant tasked with summarizing invoices.

  Extract the following information from the provided invoice PDF.  If a field cannot be determined, use \"unknown\".

  - Invoice Number: The invoice number.
  - Invoice Date: The date of the invoice (YYYY-MM-DD).
  - Amount Due: The total amount due on the invoice.
  - Vendor Name: The name of the company that issued the invoice.
  - Vendor Address: The full address of the vendor, including street, city, state, and zip code.

  Here is the invoice PDF:
  {{media url=invoicePdfDataUri}}

  Return the extracted information in JSON format.
`,
});

const generateInvoiceSummaryFlow = ai.defineFlow(
  {
    name: 'generateInvoiceSummaryFlow',
    inputSchema: InvoiceSummaryInputSchema,
    outputSchema: InvoiceSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
