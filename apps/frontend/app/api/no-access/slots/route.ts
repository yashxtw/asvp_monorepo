import { proxyBackendGet } from "@/lib/backendProxy";

export async function GET(req: Request) {
    return proxyBackendGet(req, "/no-access/slots");
}
