'use client';

import { Search, AlertCircle, Users } from 'lucide-react';

export default function SearchSidebar() {
  const suggestions = [
    'Acetone AR Grade',
    'Acetone Extra Pure',
    'Acetone HPLC',
    'Acetone Solvent',
  ];

  return (
    <div className="space-y-6 sticky top-4">
      <div className="border border-border rounded-lg p-6 bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <Search className="text-primary" size={24} />
          <h3 className="text-lg font-bold text-foreground">Search Tips</h3>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Check spelling or try more general keywords.
        </p>
      </div>

      <div className="border border-border rounded-lg p-6 bg-surface">
        <h3 className="text-lg font-bold text-foreground mb-4">Did you mean?</h3>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <a
              key={suggestion}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="block text-primary hover:text-primary-hover text-sm transition"
            >
              {suggestion}
            </a>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-primary" size={24} />
          <h3 className="font-bold text-foreground">Can't find what you're looking for?</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          We can help you find the right product.
        </p>
        <button className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg transition">
          Request for Quote
        </button>
      </div>

      <div className="border border-border rounded-lg p-6 bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-primary" size={24} />
          <h3 className="font-bold text-foreground">Need Bulk Quantity?</h3>
        </div>
        <button className="w-full bg-surface-elevated hover:bg-border text-foreground font-semibold py-2 rounded-lg transition border border-border">
          Contact Sales
        </button>
      </div>
    </div>
  );
}
