import { NextResponse } from 'next/server';

import { getAdminFirestore, getAdminStorage } from '@/firebase/admin';
import { generateInvoiceSummary } from '@/ai/flows/generate-invoice-summary';

type ExtractRequestBody = {
  invoiceId: string;
  storagePath: string;
};

export async function POST(request: Request) {
  let body: ExtractRequestBody;
  try {
    body = (await request.json()) as ExtractRequestBody;
  } catch {
    console.error('Invalid JSON body in extract API');
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const invoiceId = body?.invoiceId;
  const storagePath = body?.storagePath;

  if (!invoiceId || !storagePath) {
    console.error('Missing invoiceId or storagePath in extract API', { invoiceId, storagePath });
    return NextResponse.json(
      { error: '`invoiceId` and `storagePath` are required.' },
      { status: 400 }
    );
  }

  console.log('Starting extraction for invoice', { invoiceId, storagePath });

  const firestore = getAdminFirestore();
  const storage = getAdminStorage();

  const invoiceRef = firestore.collection('invoices').doc(invoiceId);

  try {
    await invoiceRef.update({
      extractionStatus: 'processing',
      extractionUpdatedAt: new Date().toISOString(),
    });

    console.log('Downloading PDF from storage', storagePath);
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [pdfBytes] = await file.download();

    console.log('PDF downloaded, size:', pdfBytes.length);

    const dataUri = `data:application/pdf;base64,${pdfBytes.toString('base64')}`;

    console.log('Calling AI extraction');
    const extracted = await generateInvoiceSummary({ invoicePdfDataUri: dataUri });

    console.log('Extraction successful', extracted);

    await invoiceRef.update({
      ...extracted,
      extractionStatus: 'done',
      extractionUpdatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Extraction failed', error);
    // Best-effort: mark extraction error on the invoice doc.
    try {
      await invoiceRef.update({
        extractionStatus: 'error',
        extractionError: String(error?.message || error),
        extractionUpdatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error('Failed to update extraction error', updateError);
    }

    return NextResponse.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
