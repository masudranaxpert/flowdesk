import { ReactNode } from 'react';
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Dialog({ open, onOpenChange, title, description, children, maxWidth = 'max-w-lg' }: DialogProps) {
  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6`}>
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="leading-6">{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}
