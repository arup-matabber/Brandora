"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, Globe, Sparkles, X } from "lucide-react";
import { FontItem, FontCategory, FontSortOption } from "@/lib/typography/types";
import { fontService, loadGoogleFontPreview } from "@/lib/typography/font-service";
import { CURATED_FONTS } from "@/canvas/objects/FontObject";

interface GoogleFontPickerProps {
  value: string; // current font family name (e.g. "Inter", "Playfair Display")
  category?: string;
  onSelect: (font: {
    family: string;
    category: string;
    variants: string[];
    files?: Record<string, string>;
    provider: string;
  }) => void;
  className?: string;
  placeholder?: string;
  triggerSize?: "sm" | "md";
  triggerLabel?: string;
  direction?: "up" | "down";
  alignDropdown?: "left" | "right";
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Display", value: "display" },
  { label: "Mono", value: "monospace" },
  { label: "Handwriting", value: "handwriting" },
];

export function GoogleFontPicker({
  value,
  category,
  onSelect,
  className = "",
  placeholder = "Select Google Font...",
  triggerSize = "sm",
  triggerLabel,
  direction = "down",
  alignDropdown = "left",
}: GoogleFontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState<FontSortOption>("popularity");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Fetch fonts when open or when search / category / sort changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const result = await fontService.getFonts({
          search: search.trim() || undefined,
          category: selectedCategory ? (selectedCategory as FontCategory) : undefined,
          sort,
          limit: 30,
        });

        if (isMounted) {
          setFonts(result.fonts);
          setIsLoading(false);

          // Preload preview stylesheets for visible fonts
          result.fonts.slice(0, 15).forEach((f) => {
            loadGoogleFontPreview(f.family, ["400"]);
          });
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, search, selectedCategory, sort]);

  const handleSelectFont = (font: FontItem) => {
    loadGoogleFontPreview(font.family, font.variants || ["400", "700"]);
    onSelect({
      family: font.family,
      category: font.category,
      variants: font.variants || ["regular"],
      files: font.files,
      provider: "google",
    });
    setIsOpen(false);
  };

  const currentFamilyName = value.replace(/^['"]|['"]$/g, "");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger Button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-no-drag="true"
        className={
          triggerLabel
            ? "flex items-center gap-1 text-[11px] text-ink-secondary hover:text-ink font-medium px-2 py-0.5 rounded hover:bg-stone-100 transition-colors"
            : `w-full flex items-center justify-between rounded-md border border-border-subtle bg-surface text-ink text-left transition-all hover:border-ink/40 focus:border-ink focus:outline-none ${
                triggerSize === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
              }`
        }
        title={`Active Font: ${currentFamilyName}`}
      >
        {triggerLabel ? (
          <>
            <span>{triggerLabel}</span>
            <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate" style={{ fontFamily: `"${currentFamilyName}", sans-serif` }}>
                {currentFamilyName || placeholder}
              </span>
              {category && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-stone-100 text-ink-tertiary uppercase shrink-0">
                  {category.replace("-", " ")}
                </span>
              )}
            </div>
            <ChevronDown
              size={13}
              className={`text-ink-tertiary transition-transform shrink-0 ml-1.5 ${
                isOpen ? "rotate-180 text-ink" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* ── Dropdown / Popover ────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`absolute z-[9999] ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1"
          } ${
            alignDropdown === "right" ? "right-0" : "left-0"
          } w-72 sm:w-80 rounded-xl border border-border-subtle bg-surface shadow-lifted overflow-hidden flex flex-col`}
          style={{
            maxHeight: "380px",
            background: "#FFFFFF",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
          onClick={(e) => e.stopPropagation()}
          data-no-drag="true"
        >
          {/* Header Search */}
          <div className="p-2 border-b border-border-subtle bg-stone-50/70 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 1,940+ Google Fonts..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border-subtle bg-white text-ink placeholder:text-ink-tertiary outline-none focus:border-ink/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors shrink-0 ${
                      active
                        ? "bg-ink text-white"
                        : "bg-stone-100 text-ink-secondary hover:bg-stone-200/80 hover:text-ink"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font List */}
          <div className="flex-1 overflow-y-auto p-1 divide-y divide-border-subtle/50">
            {isLoading && fonts.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-tertiary flex flex-col items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                <span>Searching Google Fonts...</span>
              </div>
            ) : fonts.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-tertiary px-4">
                No Google Fonts matched &ldquo;{search}&rdquo;. Try another search term.
              </div>
            ) : (
              fonts.map((font) => {
                const isSelected = font.family.toLowerCase() === currentFamilyName.toLowerCase();
                const styleCount = font.variants?.length || 1;

                return (
                  <button
                    key={font.id || font.family}
                    type="button"
                    onClick={() => handleSelectFont(font)}
                    className={`w-full px-2.5 py-2 rounded-lg text-left transition-colors flex items-center justify-between group ${
                      isSelected
                        ? "bg-stone-100 text-ink font-semibold"
                        : "hover:bg-stone-50 text-ink"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div
                        className="text-sm tracking-tight text-ink truncate"
                        style={{ fontFamily: `"${font.family}", sans-serif` }}
                      >
                        {font.family}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-tertiary mt-0.5">
                        <span className="capitalize">{font.category}</span>
                        <span>·</span>
                        <span>{styleCount} {styleCount === 1 ? "style" : "styles"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && <Check size={14} className="text-ink shrink-0" />}
                      <span className="text-[10px] font-serif text-ink-tertiary opacity-70 group-hover:opacity-100">
                        Aa
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 border-t border-border-subtle bg-stone-50 text-[10px] text-ink-tertiary flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Globe size={10} />
              <span>Google Fonts Library (1,940+)</span>
            </div>
            <span className="text-[9px] font-mono">Live CDN</span>
          </div>
        </div>
      )}
    </div>
  );
}
