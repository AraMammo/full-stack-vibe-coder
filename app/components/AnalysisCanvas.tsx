"use client";

import { useState } from "react";

interface BusinessName {
  name: string;
  tagline: string;
  domain?: string;
}

interface AudienceSegment {
  segment: string;
  description: string;
  painPoint?: string;
}

interface Feature {
  name: string;
  description: string;
  icon?: string;
}

interface Monetization {
  model: string;
  suggestedPricing: string;
  rationale: string;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface AnalysisData {
  businessNames: BusinessName[];
  valueProposition: string;
  targetAudience: AudienceSegment[];
  competitivePositioning: string;
  features?: Feature[];
  monetization?: Monetization;
  colorPalette?: ColorPalette;
  sitePreviewHtml: string;
  message: string;
}

type CanvasTab = "preview" | "brief" | "brand";

export default function AnalysisCanvas({
  analysis,
  selectedName,
  onSelectName,
  onClose,
}: {
  analysis: AnalysisData;
  selectedName: number;
  onSelectName: (idx: number) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<CanvasTab>("preview");

  const tabs: { id: CanvasTab; label: string }[] = [
    { id: "preview", label: "Site Preview" },
    { id: "brief", label: "Business Brief" },
    { id: "brand", label: "Brand" },
  ];

  return (
    <div className="h-full flex flex-col bg-base border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50">
        <div className="flex items-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent/15 text-accent"
                  : "text-fsvc-text-disabled hover:text-fsvc-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-raised text-fsvc-text-disabled hover:text-fsvc-text transition-colors"
          aria-label="Close canvas"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "preview" && (
          <PreviewTab analysis={analysis} selectedName={selectedName} />
        )}
        {activeTab === "brief" && (
          <BriefTab
            analysis={analysis}
            selectedName={selectedName}
            onSelectName={onSelectName}
          />
        )}
        {activeTab === "brand" && (
          <BrandTab analysis={analysis} />
        )}
      </div>
    </div>
  );
}

function PreviewTab({ analysis, selectedName }: { analysis: AnalysisData; selectedName: number }) {
  const name = analysis.businessNames[selectedName]?.name || "Your Site";
  const domain = analysis.businessNames[selectedName]?.domain || "yoursite.com";

  return (
    <div className="p-4">
      {/* Browser Chrome */}
      <div className="rounded-xl overflow-hidden border border-border shadow-2xl">
        {/* Title bar */}
        <div className="bg-[#1a1a1a] px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-[#2a2a2a] rounded-md px-4 py-1 flex items-center gap-2 max-w-xs w-full">
              <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-400 truncate">{domain}</span>
            </div>
          </div>
        </div>

        {/* Site content */}
        <div
          className="bg-white overflow-hidden"
          style={{ maxHeight: "70vh" }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: analysis.sitePreviewHtml }}
            style={{ overflow: "hidden" }}
          />
        </div>
      </div>

      <p className="text-center text-xs text-fsvc-text-disabled mt-4">
        This is a preview of what your site could look like. The full build includes all pages, database, auth, and payments.
      </p>
    </div>
  );
}

function BriefTab({
  analysis,
  selectedName,
  onSelectName,
}: {
  analysis: AnalysisData;
  selectedName: number;
  onSelectName: (idx: number) => void;
}) {
  return (
    <div className="p-4 space-y-6">
      {/* Business Names */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
          Business Name Options
        </h3>
        <div className="space-y-2">
          {analysis.businessNames.map((bn, idx) => (
            <button
              key={idx}
              onClick={() => onSelectName(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedName === idx
                  ? "border-accent/50 bg-accent/10"
                  : "border-border bg-surface hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-fsvc-text text-sm">{bn.name}</p>
                {bn.domain && (
                  <span className="text-xs text-fsvc-text-disabled">{bn.domain}</span>
                )}
              </div>
              <p className="text-xs text-fsvc-text-disabled mt-0.5">{bn.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Value Proposition */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-accent/5 to-accent-2/5 border border-accent/20">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-2 mb-2">
          Value Proposition
        </h3>
        <p className="text-fsvc-text text-sm leading-relaxed">
          {analysis.valueProposition}
        </p>
      </div>

      {/* Features */}
      {analysis.features && analysis.features.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-3">
            Core Features
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {analysis.features.map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-surface border border-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  {f.icon && <span className="text-base">{f.icon}</span>}
                  <p className="font-medium text-fsvc-text text-xs">{f.name}</p>
                </div>
                <p className="text-xs text-fsvc-text-disabled leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-warning mb-3">
          Target Audience
        </h3>
        <div className="space-y-2">
          {analysis.targetAudience.map((seg, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-surface border border-border"
            >
              <p className="font-medium text-fsvc-text text-sm">{seg.segment}</p>
              <p className="text-xs text-fsvc-text-disabled mt-0.5">{seg.description}</p>
              {seg.painPoint && (
                <p className="text-xs text-error/80 mt-1">Pain: {seg.painPoint}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Positioning */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fsvc-text-secondary mb-2">
          Competitive Edge
        </h3>
        <p className="text-fsvc-text-secondary text-sm leading-relaxed">
          {analysis.competitivePositioning}
        </p>
      </div>

      {/* Monetization */}
      {analysis.monetization && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-success/5 to-accent-2/5 border border-success/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-2">
            Revenue Model
          </h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-fsvc-text">{analysis.monetization.suggestedPricing}</span>
            <span className="text-xs text-fsvc-text-disabled">{analysis.monetization.model}</span>
          </div>
          <p className="text-xs text-fsvc-text-secondary">{analysis.monetization.rationale}</p>
        </div>
      )}
    </div>
  );
}

function BrandTab({ analysis }: { analysis: AnalysisData }) {
  const palette = analysis.colorPalette;

  return (
    <div className="p-4 space-y-6">
      {/* Color Palette */}
      {palette && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
            Color Palette
          </h3>
          <div className="space-y-2">
            {Object.entries(palette).map(([name, hex]) => (
              <div key={name} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-white/10 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
                <div>
                  <p className="text-sm text-fsvc-text capitalize">{name}</p>
                  <p className="text-xs text-fsvc-text-disabled font-mono">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Names with Domains */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-2 mb-3">
          Brand Options
        </h3>
        <div className="space-y-3">
          {analysis.businessNames.map((bn, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-surface border border-border">
              <p className="font-bold text-fsvc-text">{bn.name}</p>
              <p className="text-xs text-fsvc-text-secondary mt-0.5">{bn.tagline}</p>
              {bn.domain && (
                <p className="text-xs text-accent-2 mt-1 font-mono">{bn.domain}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features as Brand Pillars */}
      {analysis.features && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-3">
            Product Pillars
          </h3>
          <div className="space-y-1">
            {analysis.features.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5">
                {f.icon && <span>{f.icon}</span>}
                <span className="text-sm text-fsvc-text">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
