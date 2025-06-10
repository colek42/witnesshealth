import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

export function FilterProvider({ children }) {
  const [activeOnly, setActiveOnly] = useState(true);
  const [activityMonths, setActivityMonths] = useState(6);
  const [minPRs, setMinPRs] = useState(1);
  
  // Helper function to check if a contributor is active
  const isContributorActive = (prs, authorLogin) => {
    if (!activeOnly) return true;
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - activityMonths);
    
    return prs.some(pr => {
      if (pr.author?.login !== authorLogin) return false;
      if (!pr.mergedAt) return false;
      return new Date(pr.mergedAt) >= cutoffDate;
    });
  };
  
  // Helper function to check if contributor meets minimum PR threshold
  const meetsMinimumPRs = (prs, authorLogin) => {
    const count = prs.filter(pr => pr.author?.login === authorLogin).length;
    return count >= minPRs;
  };
  
  // Helper to filter PRs by recency
  const filterPRsByRecency = (prs) => {
    if (!activeOnly) return prs;
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - activityMonths);
    
    return prs.filter(pr => {
      if (!pr.mergedAt) return false;
      return new Date(pr.mergedAt) >= cutoffDate;
    });
  };
  
  const value = {
    activeOnly,
    setActiveOnly,
    activityMonths,
    setActivityMonths,
    minPRs,
    setMinPRs,
    isContributorActive,
    meetsMinimumPRs,
    filterPRsByRecency
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}