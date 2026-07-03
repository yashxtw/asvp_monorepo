"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";

import BrandStats from "@/components/brandsPage/BrandStats";
import BrandList from "@/components/brandsPage/BrandList";
import EditBrandModal from "@/components/brandsPage/EditBrandModal";
import DeleteBrandModal from "@/components/brandsPage/DeleteBrandModal";

type brands = {
  id: string;
  brand_name: string;
  canonical_urls: string[];
  description: string;
  logo_url: string;
  competitors: string[];
  total_queries: number;
  active_queries: number;
  last_run_time: string | null;
  avg_visibility: number | null;
  avg_sentiment: number | null;
  mention_rate: number | null;
};

export default function NewBrandPage() {
  const [brands, setBrands] = useState<brands[]>([]);
  const [brandsCount, setBrandsCount] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [activeQueryCount, setActiveQueryCount] = useState(0);

  const [fetchBrandsError, setFetchBrandsError] = useState<string | null>(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<brands | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<brands | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const [deletingBrandLoading, setDeletingBrandLoading] = useState(false);

  useEffect(() => {
    setBrandsLoading(true);
    axios
      .get("/brands")
      .then((res) => {
        setBrands(res.data);
        setBrandsCount(res.data.length);
      })
      .catch(() => setFetchBrandsError("Failed to load brands"))
      .finally(() => setBrandsLoading(false));
  }, []);

  useEffect(() => {
    axios
      .get("/queries/queries_for_brand_page")
      .then((res) => {
        setQueryCount(res.data.length);
        const activeCount = res.data.filter((q: any) => q.is_active && !q.is_paused).length;
        setActiveQueryCount(activeCount);
      })
      .catch(() => setFetchBrandsError("Failed to load queries"));
  }, []);

  async function refreshBrands() {
    setBrandsLoading(true);
    axios
      .get("/brands")
      .then((res) => {
        setBrands(res.data);
        setBrandsCount(res.data.length);
      })
      .catch(() => setFetchBrandsError("Failed to load brands"))
      .finally(() => setBrandsLoading(false));
  }

  async function deleteBrand(brandId: string) {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;

    setDeletingBrand(brand);
  }

  async function confirmDeleteBrand() {
    if (!deletingBrand) return;

    try {
      setDeletingBrandLoading(true);
      await axios.delete(`/brands/${deletingBrand.id}`);
      await refreshBrands();
      setDeletingBrand(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete brand");
    } finally {
      setDeletingBrandLoading(false);
    }
  }

  function editBrand(brandId: string) {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;
    setEditingBrand(brand);
  }

  async function saveBrandEdits(payload: {
    brand_name: string;
    canonical_urls: string[];
    description: string;
    logo_url: string;
    competitors: string[];
  }) {
    if (!editingBrand) return;

    try {
      setSavingBrand(true);
      await axios.patch(`/brands/${editingBrand.id}`, payload);
      await refreshBrands();
      setEditingBrand(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update brand");
    } finally {
      setSavingBrand(false);
    }
  }

  async function getBrandQueryIds(brandId: string): Promise<string[]> {
    const res = await axios.get(`/queries?brand_id=${brandId}`);
    const queries = res.data?.queries ?? res.data ?? [];
    return queries.map((q: any) => q.id);
  }

  async function runBrandAction(
    brandId: string,
    action: "run_once" | "activate" | "pause" | "resume" | "unschedule"
  ) {
    try {
      setActionLoadingKey(`${brandId}:${action}`);

      const queryIds = await getBrandQueryIds(brandId);
      if (queryIds.length === 0) {
        alert("No queries found for this brand.");
        return;
      }

      if (action === "unschedule") {
        const ok = confirm(`Unschedule all ${queryIds.length} queries for this brand?`);
        if (!ok) return;
      }

      for (const queryId of queryIds) {
        if (action === "run_once") {
          await axios.post(`/queries/${queryId}/manual-run`, {});
          continue;
        }

        if (action === "activate") {
          await axios.post(`/queries/${queryId}/auto-schedule`, {});
          continue;
        }

        if (action === "pause") {
          await axios.post(`/queries/${queryId}/pause`, {});
          continue;
        }

        if (action === "resume") {
          await axios.post(`/queries/${queryId}/resume`, {});
          continue;
        }

        if (action === "unschedule") {
          await axios.post(`/queries/${queryId}/unschedule`, {});
        }
      }

      await refreshBrands();
      const queryRes = await axios.get("/queries/queries_for_brand_page");
      setQueryCount(queryRes.data.length);
      setActiveQueryCount(queryRes.data.filter((q: any) => q.is_active && !q.is_paused).length);
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action} queries for this brand`);
    } finally {
      setActionLoadingKey(null);
    }
  }

  return (
    <main className="pt-28 sm:pt-0 space-y-8">
      <div className="">
        <div className="lg:col-span-1">
          <BrandStats
            brandsCount={brandsCount}
            queryCount={queryCount}
            activeQueryCount={activeQueryCount}
            refreshBrands={refreshBrands}
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <BrandList
          brands={brands}
          brandsLoading={brandsLoading}
          fetchError={fetchBrandsError}
          onEdit={editBrand}
          onDelete={deleteBrand}
          actionLoadingKey={actionLoadingKey}
          onRunAllQueriesOnce={(brandId) => runBrandAction(brandId, "run_once")}
          onActivateAllQueries={(brandId) => runBrandAction(brandId, "activate")}
          onPauseAllQueries={(brandId) => runBrandAction(brandId, "pause")}
          onResumeAllQueries={(brandId) => runBrandAction(brandId, "resume")}
          onUnscheduleAllQueries={(brandId) => runBrandAction(brandId, "unschedule")}
        />
      </div>

      {editingBrand && (
        <EditBrandModal
          brand={editingBrand}
          saving={savingBrand}
          onClose={() => setEditingBrand(null)}
          onSave={saveBrandEdits}
        />
      )}

      {deletingBrand && (
        <DeleteBrandModal
          brand={deletingBrand}
          deleting={deletingBrandLoading}
          onClose={() => {
            if (!deletingBrandLoading) {
              setDeletingBrand(null);
            }
          }}
          onConfirm={confirmDeleteBrand}
        />
      )}
    </main>
  );
}
