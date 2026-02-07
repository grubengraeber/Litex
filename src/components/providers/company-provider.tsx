"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface CompanyContextValue {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
});

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedCompanyId");
    if (stored && stored !== "null") {
      setSelectedCompanyId(stored);
    }
  }, []);

  const handleSetCompany = (id: string | null) => {
    setSelectedCompanyId(id);
    if (id) {
      localStorage.setItem("selectedCompanyId", id);
    } else {
      localStorage.removeItem("selectedCompanyId");
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId: handleSetCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
