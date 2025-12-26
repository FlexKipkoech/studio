'use server';

/**
 * @fileOverview Flow for generating a one-page, exportable PDF report summarizing key dashboard metrics.
 *
 * - generateDashboardReport - A function that generates the dashboard report.
 * - GenerateDashboardReportInput - The input type for the generateDashboardReport function.
 * - GenerateDashboardReportOutput - The return type for the generateDashboardReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas for the metrics
const DashboardMetricsSchema = z.object({
  totalOutstandingDebt: z.number().describe('The total outstanding debt amount.'),
  overdueInvoices: z.number().describe('The number of overdue invoices.'),
  paymentTrends: z.string().describe('A summary of recent payment trends.'),
  recentActivity: z.string().describe('A summary of recent account activity.'),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

const VisualizationTypeSchema = z.enum(['bar_chart', 'line_chart', 'pie_chart', 'number'])

const RecommendedVisualizationSchema = z.object({
  metric: z.string().describe('The name of the metric from the DashboardMetrics object.'),
  visualizationType: VisualizationTypeSchema.describe('The recommended visualization type for the metric.'),
  justification: z.string().describe('Why this visualization type is recommended.')
})

const DashboardReportInputSchema = DashboardMetricsSchema.extend({
  requestedVisualizations: z.array(RecommendedVisualizationSchema).optional().describe('The user has requested specific visualizations. Follow these if they exist.'),
});

export type GenerateDashboardReportInput = z.infer<typeof DashboardReportInputSchema>;

const DashboardReportOutputSchema = z.object({
  report: z.string().describe('A one-page summary report in markdown format, including visualizations in base64 encoded format where appropriate.'),
});

export type GenerateDashboardReportOutput = z.infer<typeof DashboardReportOutputSchema>;


export async function generateDashboardReport(input: GenerateDashboardReportInput): Promise<GenerateDashboardReportOutput> {
  return generateDashboardReportFlow(input);
}

const narrativePrompt = ai.definePrompt({
  name: 'dashboardNarrativePrompt',
  input: {schema: DashboardReportInputSchema},
  output: {schema: DashboardReportOutputSchema},
  prompt: `You are an AI assistant specialized in creating financial reports.

  You will be given key dashboard metrics related to invoice management and your task is to generate a concise one-page report in markdown format. This report should include a brief narrative summarizing the most important information, specifically focusing on the total outstanding debt, overdue invoices, payment trends and recent activity. 

  Ensure the report is easily exportable as a PDF.

  Dashboard Metrics:
  Total Outstanding Debt: {{{totalOutstandingDebt}}}
  Overdue Invoices: {{{overdueInvoices}}}
  Payment Trends: {{{paymentTrends}}}
  Recent Activity: {{{recentActivity}}}

  Report:`,
});

const generateDashboardReportFlow = ai.defineFlow(
  {
    name: 'generateDashboardReportFlow',
    inputSchema: DashboardReportInputSchema,
    outputSchema: DashboardReportOutputSchema,
  },
  async input => {
    const {output} = await narrativePrompt(input);
    return output!;
  }
);
