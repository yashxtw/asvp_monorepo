import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/generateRecommendations";

const { generateRecommendations } = proxyActivities<typeof activities>({
    startToCloseTimeout: "10 minutes",
});

export async function recommendationsDailyWorkflow(input: {
    customerId: string;
}) {
    await generateRecommendations(input);
}
