"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface SetupImageSlotProps {
  id: string;
  label: string;
  previewUrl: string | null;
  /** Existing image is still being signed, so the empty drop zone would flash. */
  isLoading: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}

export function SetupImageSlot({
  id,
  label,
  previewUrl,
  isLoading,
  error,
  onSelect,
  onClear,
}: SetupImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function takeFile(file: File | undefined) {
    if (file) onSelect(file);
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}{" "}
        <span className="font-normal text-zinc-500">(optional)</span>
      </FieldLabel>

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60">
          <SetupImage
            src={previewUrl}
            alt={`${label} setup`}
            className="aspect-video w-full object-contain"
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => inputRef.current?.click()}
              className="h-7 bg-zinc-950/80 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50"
            >
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClear}
              className="h-7 bg-zinc-950/80 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50"
            >
              <X />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 text-zinc-400 transition-colors duration-200 hover:border-zinc-500 hover:text-zinc-200",
            dragOver && "border-emerald-400/60 bg-emerald-400/5 text-emerald-300",
            isLoading && "pointer-events-none animate-pulse",
          )}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">
            {isLoading ? "Loading image…" : "Drop an image or browse"}
          </span>
          <span className="text-[11px] text-zinc-600">JPEG, PNG, or WebP · 5 MB</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <FieldError errors={error ? [{ message: error }] : []} />
    </Field>
  );
}

/** Signed URLs expire, so they are not a stable `next/image` source. */
export function SetupImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
