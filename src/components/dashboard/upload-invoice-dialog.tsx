
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
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
    if (!file || !auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'File or User Missing',
        description: 'Please select a file and ensure you are logged in.',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const currentUser = auth.currentUser;
      const storagePath = `invoices/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);

      // 1. Upload file to Firebase Storage
      await uploadBytes(storageRef, file);

      // 2. Create document in Firestore
      const invoiceData = {
        userId: currentUser.uid,
        storagePath: storagePath,
        status: 'pending',
        createdAt: serverTimestamp(),
        // Placeholders until AI extraction is implemented
        invoiceNumber: 'N/A',
        invoiceDate: 'N/A',
        amountDue: 0,
        vendorName: 'N/A',
        vendorAddress: 'N/A',
        extractionStatus: 'pending', // Mark as pending for later processing
      };
      
      const invoicesCollection = collection(firestore, 'invoices');
      await addDoc(invoicesCollection, invoiceData);

      // 3. Log activity
      logActivity({
        firestore,
        auth,
        action: 'Invoice Uploaded',
        details: `Uploaded invoice PDF: ${file.name}.`,
      });

      toast({
        title: 'Invoice Saved!',
        description: 'Your invoice has been successfully uploaded.',
      });

      handleOpenChange(false); // Close dialog on success

    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setIsSaving(false);
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
            Select a PDF invoice to upload to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="invoice-pdf">Invoice PDF</Label>
            <Input id="invoice-pdf" type="file" accept="application/pdf" onChange={handleFileChange} disabled={isSaving}/>
          </div>
          {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveInvoice} disabled={!file || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
