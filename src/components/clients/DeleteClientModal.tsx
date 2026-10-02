"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteClientModalProps {
  clientName: string;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting?: boolean;
}

export function DeleteClientModal({
  clientName,
  onConfirm,
  onClose,
  isDeleting = false,
}: DeleteClientModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 text-red-600 mb-3">
          <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={16} />
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            Delete Client
          </h3>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed">
          Are you sure you want to remove <span className="font-semibold text-ink">&ldquo;{clientName}&rdquo;</span> from your directory? This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full text-xs"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-8 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete client"}
          </button>
        </div>
      </div>
    </div>
  );
}
