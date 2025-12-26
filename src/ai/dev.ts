import { config } from 'dotenv';
config();

import '@/ai/flows/generate-invoice-summary.ts';
import '@/ai/flows/generate-dashboard-report.ts';
import '@/ai/flows/analyze-invoice-data.ts';