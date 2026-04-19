import api from "./axios";

export async function subscribeToPlan(plan: "premium" | "custom") {
    const res = await api.post("/billing/subscribe", { plan });
    return res.data as {
        payment_link_id: string;
        payment_url: string;
    };
}
