
'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateInvoiceSummary, InvoiceSummaryOutput } from '@/ai/flows/generate-invoice-summary';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';

type UploadStep = 'select' | 'analyzing' | 'confirm' | 'saving' | 'done';

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<InvoiceSummaryOutput | null>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStep('analyzing');
      try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
          const dataUri = reader.result as string;
          const result = await generateInvoiceSummary({ invoicePdfDataUri: dataUri });
          setSummary(result);
          setStep('confirm');
        };
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not extract information from the PDF.',
        });
        resetState();
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select a PDF file.',
      });
      setFile(null);
    }
  };

  const handleSaveInvoice = async () => {
    if (!file || !summary || !auth.currentUser) return;
    setStep('saving');

    try {
      // 1. Upload file to Firebase Storage
      const storagePath = `invoices/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);

      // 2. Create document in Firestore
      const invoiceData = {
        ...summary,
        userId: auth.currentUser.uid,
        storagePath: storagePath,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, 'invoices'), invoiceData);

      // 3. Log activity
      logActivity({
        firestore,
        auth,
        action: 'Invoice Uploaded',
        details: `Uploaded invoice ${summary.invoiceNumber} for vendor ${summary.vendorName}.`,
      });

      setStep('done');
      toast({
        title: 'Invoice Saved',
        description: `${summary.vendorName} invoice has been successfully saved.`,
      });
      
      setTimeout(() => {
        resetState();
        setOpen(false);
      }, 1500)


    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Invoice',
        description: error.message,
      });
      setStep('confirm'); // Go back to confirmation step on error
    }
  };

  const resetState = () => {
    setFile(null);
    setSummary(null);
    setStep('select');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Invoice
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload New Invoice</DialogTitle>
          <DialogDescription>
            Upload a PDF invoice. We'll use AI to extract the key details.
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="invoice-pdf">Invoice PDF</Label>
              <Input id="invoice-pdf" type="file" accept="application/pdf" onChange={handleFileChange} />
            </div>
          </div>
        )}

        {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing your invoice...</p>
            </div>
        )}

        {step === 'confirm' && summary && (
            <div className="space-y-4 py-4">
                <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                    <h3 className="font-semibold">Extracted Information</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <p className="text-muted-foreground">Invoice #:</p>
                        <p className="font-medium text-right">{summary.invoiceNumber}</p>

                        <p className="text-muted-foreground">Vendor:</p>
                        <p className="font-medium text-right">{summary.vendorName}</p>

                        <p className="text-muted-foreground">Amount Due:</p>
                        <p className="font-medium text-right">${summary.amountDue.toLocaleString()}</p>

                        <p className="text-muted-foreground">Invoice Date:</p>
                        <p className="font-medium text-right">{summary.invoiceDate}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-xs">
                        Please verify the extracted information is correct before saving. You can edit these details later.
                    </p>
                </div>
            </div>
        )}

        {(step === 'saving' || step === 'done') && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                {step === 'saving' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                {step === 'done' && <CheckCircle className="h-12 w-12 text-green-500" />}
                <p className="text-muted-foreground">
                    {step === 'saving' ? 'Saving invoice...' : 'Invoice saved successfully!'}
                </p>
            </div>
        )}


        <DialogFooter>
            {step === 'confirm' && (
                <>
                <Button variant="outline" onClick={resetState}>Cancel</Button>
                <Button onClick={handleSaveInvoice}>Save Invoice</Button>
                </>
            )}
             {(step === 'select') && (
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
