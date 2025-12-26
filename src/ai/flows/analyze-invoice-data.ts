'use server';

/**
 * @fileOverview A flow for analyzing invoice data and providing insights.
 *
 * - analyzeInvoiceData - A function that analyzes invoice data and returns insights.
 * - AnalyzeInvoiceDataInput - The input type for the analyzeInvoiceData function.
 * - AnalyzeInvoiceDataOutput - The return type for the analyzeInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInvoiceDataInputSchema = z.object({
  invoiceDataCsv: z
    .string()
    .describe('Invoice data in CSV format, with columns like invoice number, customer, amount, due date, and payment date.'),
});
export type AnalyzeInvoiceDataInput = z.infer<typeof AnalyzeInvoiceDataInputSchema>;

const AnalyzeInvoiceDataOutputSchema = z.object({
  paymentTrends: z.string().describe('Summary of payment trends over the provided period.'),
  topDebtors: z.string().describe('List of top debtors with outstanding amounts.'),
  cashFlowIssues: z
    .string()
    .describe('Potential cash flow issues identified from the invoice data, and a visualization type recommendation.'),
});
export type AnalyzeInvoiceDataOutput = z.infer<typeof AnalyzeInvoiceDataOutputSchema>;

export async function analyzeInvoiceData(input: AnalyzeInvoiceDataInput): Promise<AnalyzeInvoiceDataOutput> {
  return analyzeInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInvoiceDataPrompt',
  input: {schema: AnalyzeInvoiceDataInputSchema},
  output: {schema: AnalyzeInvoiceDataOutputSchema},
  prompt: `You are a finance expert specializing in analyzing invoice data and providing insights.

You will analyze the provided invoice data to identify payment trends, top debtors, and potential cash flow issues.

Invoice Data (CSV):
{{invoiceDataCsv}}

Analyze the data and provide the following:

1.  Payment Trends: Summarize payment trends over the provided period.
2.  Top Debtors: List the top debtors with outstanding amounts.
3.  Cash Flow Issues: Identify potential cash flow issues from the invoice data.

Finally, suggest the best type of visualization to represent the cash flow issues (e.g., line chart, bar chart). Use reasoning to explain why that visualization type would be optimal for the specific insights.

Make sure that you fill the visualization type suggestion and the reason in cashFlowIssues output field.
`,
});

const analyzeInvoiceDataFlow = ai.defineFlow(
  {
    name: 'analyzeInvoiceDataFlow',
    inputSchema: AnalyzeInvoiceDataInputSchema,
    outputSchema: AnalyzeInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
