
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { ref, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();

  useEffect(() => {
    return () => {
      uploadTaskRef.current?.cancel();
      uploadTaskRef.current = null;
    };
  }, []);

  const resetState = () => {
    uploadTaskRef.current?.cancel();
    uploadTaskRef.current = null;
    setFile(null);
    setStoragePath(null);
    setUploadProgress(null);
    setIsUploadComplete(false);
    setIsSaving(false);
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

      // Check if user is active (required by Firestore security rules)
      try {
        const userDocSnap = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
        if (!userDocSnap.exists() || !userDocSnap.data()?.isActive) {
          toast({
            variant: 'destructive',
            title: 'Account Inactive',
            description: 'Your account is not active. Please contact an admin.',
          });
          return;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not verify account status.',
        });
        return;
      }

      // Guardrail: large PDFs can be slow to upload.
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Large PDF',
          description:
            'This invoice is larger than 10MB. Upload may take longer.',
        });
      }

      // Start upload immediately so Save feels instant.
      const currentUser = auth.currentUser;
      const path = `invoices/${currentUser.uid}/${Date.now()}_${selectedFile.name}`;
      setFile(selectedFile);
      setStoragePath(path);
      setUploadProgress(0);
      setIsUploadComplete(false);

      uploadTaskRef.current?.cancel();
      uploadTaskRef.current = null;

      const task = uploadBytesResumable(ref(storage, path), selectedFile);
      uploadTaskRef.current = task;

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
          console.error('Upload failed:', error);
          setUploadProgress(null);
          setIsUploadComplete(false);
          uploadTaskRef.current = null;
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description:
              error?.code === 'storage/unauthorized'
                ? 'You do not have permission to upload files.'
                : error?.message || 'Could not upload the PDF invoice.',
          });
        },
        () => {
          setUploadProgress(100);
          setIsUploadComplete(true);
          uploadTaskRef.current = null;
        }
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select a PDF file.',
      });
      setFile(null);
      setStoragePath(null);
      setUploadProgress(null);
      setIsUploadComplete(false);
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

    if (!storagePath) {
      toast({
        variant: 'destructive',
        title: 'Upload Not Started',
        description: 'Please re-select the PDF to start uploading.',
      });
      return;
    }

    if (!isUploadComplete) {
      toast({
        title: 'Uploading…',
        description: 'Please wait for the PDF upload to finish, then save.',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const currentUser = auth.currentUser;
      // Create document in Firestore (fast) and trigger AI extraction in background.
      const invoiceData = {
        userId: currentUser.uid,
        storagePath: storagePath,
        status: 'pending',
        createdAt: serverTimestamp(),
        invoiceNumber: '',
        invoiceDate: '',
        amountDue: 0,
        vendorName: '',
        vendorAddress: '',
        extractionStatus: 'processing',
      };
      
      const invoicesCollection = collection(firestore, 'invoices');
      const docRef = await addDoc(invoicesCollection, invoiceData);

      // Kick off server-side extraction without blocking the UI.
      void fetch('/api/invoices/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          invoiceId: docRef.id,
          storagePath,
        }),
      }).catch((err) => {
        console.error('Failed to start server-side extraction:', err);
      });

      // 3. Log activity
      logActivity({
        firestore,
        auth,
        action: 'Invoice Uploaded',
        details: `Uploaded invoice PDF: ${file.name}.`,
      });

      toast({
        title: 'Invoice Saved!',
        description: 'Invoice saved. Extracting details in the background…',
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
          {file && uploadProgress !== null && !isUploadComplete && (
            <p className="text-sm text-muted-foreground">Uploading: {uploadProgress}%</p>
          )}
          {file && isUploadComplete && (
            <p className="text-sm text-muted-foreground">Upload complete.</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveInvoice} disabled={!file || !isUploadComplete || isSaving}>
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
