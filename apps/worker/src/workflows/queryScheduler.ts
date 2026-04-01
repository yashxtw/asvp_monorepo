import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/createRun";
import type * as answerActivities from "../activities/fetchAndStoreAnswer";
import type * as parseAnswerActivities from "../activities/parseAnswer";
import { defineSignal, setHandler, workflowInfo } from "@temporalio/workflow";

export const pauseSignal = defineSignal("pause");
export const resumeSignal = defineSignal("resume");

const { createRun } = proxyActivities<typeof activities>({
    startToCloseTimeout: "3 minutes"
});

const { fetchAndStoreAnswer } = proxyActivities<typeof answerActivities>({
    startToCloseTimeout: "3 minutes",
});

const { parseAnswer } = proxyActivities<typeof parseAnswerActivities>({
    startToCloseTimeout: "3 minutes",
});

export async function querySchedulerWorkflow(input: {
    queryId: string;
    sourceId?: string;
    sourceIds?: string[];
    customer_id: string;
    brand_id: string;
    trigger_type?: "manual" | "scheduled" | "retry";
}) {
    let paused = false;

    setHandler(pauseSignal, () => {
        paused = true;
    });

    setHandler(resumeSignal, () => {
        paused = false;
    });

    if (paused) {
        return;
    }

    const sourceIds = input.sourceIds && input.sourceIds.length > 0
        ? input.sourceIds
        : input.sourceId
            ? [input.sourceId]
            : [];

    if (sourceIds.length === 0) {
        throw new Error("No sourceIds provided");
    }

    const execution_group_id = workflowInfo().runId;
    const failures: string[] = [];

    for (const sourceId of sourceIds) {
        try {
            const runInput = {
                queryId: input.queryId,
                sourceId,
                customer_id: input.customer_id,
                execution_group_id,
                trigger_type: input.trigger_type ?? "scheduled",
            };

            const { runId } = await createRun(runInput);

            await fetchAndStoreAnswer({
                runId,
                queryId: input.queryId,
                sourceId,
                customer_id: input.customer_id,
                brand_id: input.brand_id,
                execution_group_id,
            });

            await parseAnswer({ runId });
        } catch (error) {
            failures.push(sourceId);
        }
    }

    if (failures.length === sourceIds.length) {
        throw new Error(`All sources failed: ${failures.join(",")}`);
    }
}
