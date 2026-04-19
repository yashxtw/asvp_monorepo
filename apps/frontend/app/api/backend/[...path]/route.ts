import { proxyBackendRequest } from "@/lib/backendProxy";

type RouteContext = {
    params: Promise<{
        path: string[];
    }>;
};

async function handle(req: Request, context: RouteContext) {
    const { path } = await context.params;
    return proxyBackendRequest(req, `/${path.join("/")}`);
}

export async function GET(req: Request, context: RouteContext) {
    return handle(req, context);
}

export async function POST(req: Request, context: RouteContext) {
    return handle(req, context);
}

export async function PATCH(req: Request, context: RouteContext) {
    return handle(req, context);
}

export async function DELETE(req: Request, context: RouteContext) {
    return handle(req, context);
}

export async function PUT(req: Request, context: RouteContext) {
    return handle(req, context);
}
