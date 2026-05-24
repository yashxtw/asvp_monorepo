import { proxyBackendRequest } from "@/lib/backendProxy";

export async function POST(req: Request) {
    return proxyBackendRequest(req, "/no-access/request-access");
}
