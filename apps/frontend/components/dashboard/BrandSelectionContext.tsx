"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DashboardBrand = {
    id: string;
    brand_name: string;
    logo_url?: string | null;
};

type BrandSelectionContextValue = {
    brands: DashboardBrand[];
    setBrands: (brands: DashboardBrand[]) => void;
    selectedBrandId: string | null;
    setSelectedBrandId: (brandId: string | null) => void;
    selectedBrand: DashboardBrand | null;
};

const BrandSelectionContext = createContext<BrandSelectionContextValue | null>(null);

export function BrandSelectionProvider({ children }: { children: React.ReactNode }) {
    const [brands, setBrands] = useState<DashboardBrand[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

    useEffect(() => {
        if (brands.length === 0) {
            if (selectedBrandId !== null) {
                setSelectedBrandId(null);
            }
            return;
        }

        const stillValid = selectedBrandId ? brands.some((brand) => brand.id === selectedBrandId) : false;
        if (!stillValid) {
            setSelectedBrandId(brands[0].id);
        }
    }, [brands, selectedBrandId]);

    const selectedBrand = useMemo(
        () => brands.find((b) => b.id === selectedBrandId) || null,
        [brands, selectedBrandId]
    );

    return (
        <BrandSelectionContext.Provider
            value={{
                brands,
                setBrands,
                selectedBrandId,
                setSelectedBrandId,
                selectedBrand,
            }}
        >
            {children}
        </BrandSelectionContext.Provider>
    );
}

export function useBrandSelection() {
    const ctx = useContext(BrandSelectionContext);
    if (!ctx) {
        throw new Error("useBrandSelection must be used within BrandSelectionProvider");
    }
    return ctx;
}
