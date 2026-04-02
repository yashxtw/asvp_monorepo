"use client";

type Brand = {
    id: string;
    brand_name: string;
    total_queries: number;
    active_queries: number;
};

type Props = {
    brand: Brand;
    deleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function DeleteBrandModal({
    brand,
    deleting,
    onClose,
    onConfirm,
}: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <div className="space-y-3">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900">Delete Brand</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-zinc-900">{brand.brand_name}</span>?
                        </p>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        This may affect linked queries and dashboard data for this brand.
                    </div>

                    <div className="text-xs text-gray-500">
                        <p>Total queries: {brand.total_queries ?? 0}</p>
                        <p>Active queries: {brand.active_queries ?? 0}</p>
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="rounded border border-red-600 bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete Brand"}
                    </button>
                </div>
            </div>
        </div>
    );
}
