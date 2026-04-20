"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
    DashboardBrand,
    BrandSelectionProvider,
    useBrandSelection,
} from "@/components/dashboard/BrandSelectionContext";
import axios from "@/lib/axios";

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const { selectedBrand, setBrands } = useBrandSelection();

    useEffect(() => {
        let active = true;

        async function loadBrands() {
            try {
                const res = await axios.get("/brands/for_dashboard");
                const data = (Array.isArray(res.data) ? res.data : []) as DashboardBrand[];

                if (active) {
                    setBrands(data);
                }
            } catch {
                if (active) {
                    setBrands([]);
                }
            }
        }

        loadBrands();

        return () => {
            active = false;
        };
    }, [setBrands]);

    return (
        <div className="flex h-screen overflow-x-hidden bg-white">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                selectedBrandName={selectedBrand?.brand_name || null}
                selectedBrandLogoUrl={selectedBrand?.logo_url || null}
            />
            <main className="min-w-0 flex-1 overflow-y-auto p-4 text-[#171717]">{children}</main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BrandSelectionProvider>
            <DashboardShell>{children}</DashboardShell>
        </BrandSelectionProvider>
    );
}
