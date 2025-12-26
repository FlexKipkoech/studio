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
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const invoiceId = body?.invoiceId;
  const storagePath = body?.storagePath;

  if (!invoiceId || !storagePath) {
    return NextResponse.json(
      { error: '`invoiceId` and `storagePath` are required.' },
      { status: 400 }
    );
  }

  const firestore = getAdminFirestore();
  const storage = getAdminStorage();

  const invoiceRef = firestore.collection('invoices').doc(invoiceId);

  try {
    await invoiceRef.set(
      {
        extractionStatus: 'processing',
        extractionUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [pdfBytes] = await file.download();

    const dataUri = `data:application/pdf;base64,${pdfBytes.toString('base64')}`;

    const extracted = await generateInvoiceSummary({ invoicePdfDataUri: dataUri });

    await invoiceRef.set(
      {
        ...extracted,
        extractionStatus: 'done',
        extractionUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Best-effort: mark extraction error on the invoice doc.
    try {
      await invoiceRef.set(
        {
          extractionStatus: 'error',
          extractionError: String(error?.message || error),
          extractionUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
