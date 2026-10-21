'use client';

interface FilterState {
  categories: string[];
  brands: string[];
  packSizes: string[];
  purities: string[];
}

interface SearchFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function SearchFilters({
  filters,
  setFilters,
}: SearchFiltersProps) {
  const categories = [
    { name: 'Solvents & Reagents', count: 24 },
    { name: 'Analytical Reagents', count: 12 },
    { name: 'HPLC Solvents', count: 8 },
    { name: 'Laboratory Chemicals', count: 6 },
    { name: 'Industrial Chemicals', count: 4 },
  ];

  const brands = [
    { name: 'Patient', count: 18 },
    { name: 'Qualigens', count: 12 },
    { name: 'Merck', count: 10 },
    { name: 'Rankem', count: 8 },
    { name: 'Loba Chemie', count: 4 },
  ];

  const packSizes = [
    { name: '100 ml', count: 10 },
    { name: '250 ml', count: 12 },
    { name: '500 ml', count: 20 },
    { name: '1 L', count: 8 },
    { name: '2.5 L', count: 5 },
    { name: '4 L', count: 3 },
  ];

  const purities = [
    { name: 'AR Grade', count: 25 },
    { name: 'Extra Pure', count: 12 },
    { name: 'HPLC Grade', count: 10 },
    { name: 'LR Grade', count: 6 },
  ];

  const toggleFilter = (
    filterType: keyof FilterState,
    value: string
  ) => {
    setFilters({
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter((item) => item !== value)
        : [...filters[filterType], value],
    });
  };

  const handleClearAll = () => {
    setFilters({
      categories: [],
      brands: [],
      packSizes: [],
      purities: [],
    });
  };

  return (
    <div className="space-y-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Filters</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-primary hover:text-primary-hover transition"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="border border-border rounded-lg p-4 bg-surface">
        <h4 className="font-semibold mb-4 text-foreground">Category</h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category.name} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.name)}
                onChange={() => toggleFilter('categories', category.name)}
                className="w-4 h-4 bg-surface-elevated border border-border rounded cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted group-hover:text-foreground transition">
                {category.name}
              </span>
              <span className="text-xs text-muted/70 ml-auto">
                ({category.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="border border-border rounded-lg p-4 bg-surface">
        <h4 className="font-semibold mb-4 text-foreground">Brand</h4>
        <input
          type="text"
          placeholder="Search brand"
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary mb-4"
        />
        <div className="space-y-3">
          {brands.map((brand) => (
            <label key={brand.name} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand.name)}
                onChange={() => toggleFilter('brands', brand.name)}
                className="w-4 h-4 bg-surface-elevated border border-border rounded cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted group-hover:text-foreground transition">
                {brand.name}
              </span>
              <span className="text-xs text-muted/70 ml-auto">
                ({brand.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Pack Size Filter */}
      <div className="border border-border rounded-lg p-4 bg-surface">
        <h4 className="font-semibold mb-4 text-foreground">Pack Size</h4>
        <div className="space-y-3">
          {packSizes.map((size) => (
            <label key={size.name} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.packSizes.includes(size.name)}
                onChange={() => toggleFilter('packSizes', size.name)}
                className="w-4 h-4 bg-surface-elevated border border-border rounded cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted group-hover:text-foreground transition">
                {size.name}
              </span>
              <span className="text-xs text-muted/70 ml-auto">
                ({size.count})
              </span>
            </label>
          ))}
          <button className="text-sm text-primary hover:text-primary-hover transition mt-2">
            + Show more
          </button>
        </div>
      </div>

      {/* Purity/Grade Filter */}
      <div className="border border-border rounded-lg p-4 bg-surface">
        <h4 className="font-semibold mb-4 text-foreground">Purity / Grade</h4>
        <div className="space-y-3">
          {purities.map((purity) => (
            <label key={purity.name} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.purities.includes(purity.name)}
                onChange={() => toggleFilter('purities', purity.name)}
                className="w-4 h-4 bg-surface-elevated border border-border rounded cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted group-hover:text-foreground transition">
                {purity.name}
              </span>
              <span className="text-xs text-muted/70 ml-auto">
                ({purity.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className="flex gap-2">
        <button className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg transition">
          Apply Filters
        </button>
        <button className="flex-1 bg-surface-elevated hover:bg-border text-foreground font-semibold py-2 rounded-lg transition border border-border">
          Reset
        </button>
      </div>
    </div>
  );
}
