'use client';

import { useState, useEffect } from 'react';

import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DisplayNameType } from '@/types/review'; // Assuming this type exists

interface ReviewSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit expects the function passed from RatingForm
  onSubmit: (email: string, name: string | undefined, displayType: DisplayNameType) => Promise<void>; 
  reviewData: Record<string, any>; // Not directly used in modal inputs, but could be for context
}

// Zod schema for modal validation
const modalSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  name: z.string().optional(), 
  displayType: z.enum(["full", "first_initial", "initials", "private"], { required_error: "Please select a display name preference." }),
});

export function ReviewSubmitModal({ 
  isOpen,
  onClose,
  onSubmit,
  // reviewData is available if needed for display, but not directly bound
}: ReviewSubmitModalProps) {

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [displayType, setDisplayType] = useState<DisplayNameType | '' >('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setDisplayType('');
      setErrors({});
      setIsSubmittingModal(false);
    } 
  }, [isOpen]);

  const handleInternalSubmit = async () => {
    setIsSubmittingModal(true);
    setErrors({});

    const validationResult = modalSchema.safeParse({
      email,
      name: name || undefined, // Pass undefined if empty
      displayType,
    });

    if (!validationResult.success) {
      const formattedErrors: Record<string, string | undefined> = {};
      validationResult.error.errors.forEach(err => {
        if (err.path[0]) {
          formattedErrors[err.path[0]] = err.message;
        }
      });
      setErrors(formattedErrors);
      setIsSubmittingModal(false);
      return;
    }

    try {
      // Call the onSubmit prop passed from the parent (RatingForm)
      await onSubmit(validationResult.data.email, validationResult.data.name, validationResult.data.displayType as DisplayNameType);
      // Parent component (RatingForm) handles success (e.g., alert, redirect)
      // No need to call onClose here, parent likely handles it on success/error outside
    } catch (error) {
       // Parent component (RatingForm) should catch and display the error
       console.error("Modal submit handler caught error (should be handled by parent):", error);
    } finally {
       setIsSubmittingModal(false);
       // Keep modal open on error, parent decides to close it.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Almost Done! Verify Your Review</DialogTitle>
          <DialogDescription>
            Please provide your email to verify your review. Choose how your name appears publicly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email *
            </Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className={`col-span-3 ${errors['email'] ? 'border-red-500' : ''}`} 
              required
            />
            {errors['email'] && <p className="col-span-4 text-xs text-red-500 text-right -mt-2">{errors['email']}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              placeholder="(Optional, used for display options)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayType" className="text-right">
              Display As *
            </Label>
            <Select 
              value={displayType} 
              onValueChange={(value) => setDisplayType(value as DisplayNameType)}
              required
            >
              <SelectTrigger className={`col-span-3 ${errors['displayType'] ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select display preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Name (e.g., John Doe)</SelectItem>
                <SelectItem value="first_initial">First Name, Last Initial (e.g., John D.)</SelectItem>
                <SelectItem value="initials">Initials (e.g., J.D.)</SelectItem>
                <SelectItem value="private">Private Reviewer</SelectItem>
              </SelectContent>
            </Select>
            {errors['displayType'] && <p className="col-span-4 text-xs text-red-500 text-right -mt-2">{errors['displayType']}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmittingModal}>Cancel</Button>
          <Button type="button" onClick={handleInternalSubmit} disabled={isSubmittingModal}>
            {isSubmittingModal ? 'Submitting...' : 'Submit and Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 