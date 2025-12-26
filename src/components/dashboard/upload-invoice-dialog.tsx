
'use client';

import { useEffect, useRef, useState, ChangeEvent } from 'react';
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
import { ref, uploadBytes, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';

type UploadStep = 'select' | 'analyzing' | 'confirm' | 'saving' | 'done';

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onabort = () => reject(new Error('File reading was aborted.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<InvoiceSummaryOutput | null>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const uploadPromiseRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      uploadTaskRef.current?.cancel();
      uploadTaskRef.current = null;
      uploadPromiseRef.current = null;
    };
  }, []);

  const startBackgroundUpload = (selectedFile: File, path: string) => {
    if (uploadTaskRef.current || uploadPromiseRef.current) return;
    setUploadProgress(0);
    setIsUploadComplete(false);

    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, selectedFile);
    uploadTaskRef.current = task;

    uploadPromiseRef.current = new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(progress);
          }
        },
        (error) => {
          setUploadProgress(null);
          setIsUploadComplete(false);
          uploadTaskRef.current = null;
          uploadPromiseRef.current = null;
          reject(error);
        },
        () => {
          setUploadProgress(100);
          setIsUploadComplete(true);
          uploadTaskRef.current = null;
          resolve();
        }
      );
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (!auth.currentUser) {
        toast({
          variant: 'destructive',
          title: 'Not signed in',
          description: 'Please sign in before uploading an invoice.',
        });
        return;
      }

      // Guardrail: large PDFs can be slow to base64 + analyze.
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Large PDF',
          description:
            'This invoice is larger than 10MB. Upload/analysis may take longer.',
        });
      }

      setFile(selectedFile);
      setStep('analyzing');
      try {
        const currentUser = auth.currentUser;
        const path = `invoices/${currentUser.uid}/${Date.now()}_${selectedFile.name}`;
        setStoragePath(path);

        // Start uploading in the background while we run AI analysis.
        startBackgroundUpload(selectedFile, path);

        const dataUri = await fileToDataUri(selectedFile);
        const result = await generateInvoiceSummary({ invoicePdfDataUri: dataUri });
        setSummary(result);
        setStep('confirm');
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

    const currentUser = auth.currentUser;
    const finalStoragePath =
      storagePath || `invoices/${currentUser.uid}/${Date.now()}_${file.name}`;

    // Ensure the PDF is uploaded (often already completed by now).
    try {
      if (uploadPromiseRef.current) {
        await uploadPromiseRef.current;
      } else {
        const storageRef = ref(storage, finalStoragePath);
        await uploadBytes(storageRef, file);
        setUploadProgress(100);
        setIsUploadComplete(true);
      }
    } catch (error: any) {
      console.error('Error uploading invoice PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          error?.code === 'storage/unauthorized'
            ? 'You do not have permission to upload files.'
            : error?.message || 'An unexpected upload error occurred.',
      });
      setStep('confirm');
      return;
    }

    const invoiceData = {
      ...summary,
      userId: currentUser.uid,
      storagePath: finalStoragePath,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    
    try {
        // Create document in Firestore
        const invoicesCollection = collection(firestore, 'invoices');
        await addDoc(invoicesCollection, invoiceData);

        // 3. Log activity after successful save
        logActivity({
            firestore,
            auth,
            action: 'Invoice Uploaded',
            details: `Uploaded invoice ${summary.invoiceNumber} for vendor ${summary.vendorName}.`,
        });

        setStep('done');
        toast({
            title: 'Invoice Saved!',
            description: `${summary.vendorName} invoice has been successfully saved.`,
        });

        // Close dialog after a short delay
        setTimeout(() => {
            handleOpenChange(false);
        }, 1500);

    } catch (error: any) {
        console.error("Error saving invoice:", error);
        
        let description = error?.message || 'An unexpected error occurred.';
        if (error.code) {
          switch (error.code) {
            case 'storage/unauthorized':
              description = 'You do not have permission to upload files.';
              break;
            case 'permission-denied': // Firestore permission error
              description =
                'Firestore denied this save. This usually means your user profile is missing or inactive (check /users/{uid}.isActive == true) or the security rules do not allow this operation.';
              break;
          }
        }

        if (error?.code && description && !description.includes(String(error.code))) {
          description = `${description} (code: ${String(error.code)})`;
        }
        
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: description,
        });

        // Reset to confirmation step to allow user to retry
        setStep('confirm');
    }
  };


  const resetState = () => {
    uploadTaskRef.current?.cancel();
    uploadTaskRef.current = null;
    uploadPromiseRef.current = null;
    setFile(null);
    setSummary(null);
    setStoragePath(null);
    setUploadProgress(null);
    setIsUploadComplete(false);
    setStep('select');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Use a timeout to avoid clearing state before the closing animation is complete
      setTimeout(() => {
        resetState();
      }, 300);
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
                <div className="space-y-1 text-center">
                  <p className="text-muted-foreground">Analyzing your invoice...</p>
                  {uploadProgress !== null && uploadProgress < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Uploading PDF… {uploadProgress}%
                    </p>
                  )}
                </div>
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
                    {step === 'saving' ? 'Saving invoice...' : 'Invoice Saved!'}
                </p>
            </div>
        )}


        <DialogFooter>
            {step === 'confirm' && (
                <>
                <Button variant="outline" onClick={resetState}>Cancel</Button>
                <Button onClick={handleSaveInvoice}>
                  {isUploadComplete ? 'Save Invoice' : 'Save Invoice'}
                </Button>
                </>
            )}
             {(step === 'select') && (
                <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
