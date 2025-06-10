import { useFilters } from '../contexts/FilterContext';

function FilterControls() {
  const { activeOnly, setActiveOnly, activityMonths, setActivityMonths, minPRs, setMinPRs } = useFilters();
  
  return (
    <div className="filter-controls">
      <div className="filter-item">
        <label>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Show only active contributors
        </label>
      </div>
      
      {activeOnly && (
        <div className="filter-item">
          <label>
            Active within last:
            <select 
              value={activityMonths} 
              onChange={(e) => setActivityMonths(Number(e.target.value))}
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </label>
        </div>
      )}
      
      <div className="filter-item">
        <label>
          Minimum PRs:
          <select 
            value={minPRs} 
            onChange={(e) => setMinPRs(Number(e.target.value))}
          >
            <option value={1}>1+ PR</option>
            <option value={2}>2+ PRs</option>
            <option value={5}>5+ PRs</option>
            <option value={10}>10+ PRs</option>
            <option value={20}>20+ PRs</option>
          </select>
        </label>
      </div>
      
      <div className="filter-info">
        {activeOnly ? (
          <span>Showing contributors with {minPRs}+ PRs, active in the last {activityMonths} months</span>
        ) : (
          <span>Showing all contributors with {minPRs}+ PRs</span>
        )}
      </div>
    </div>
  );
}

export default FilterControls;