import { PubSub } from "@google-cloud/pubsub";
import { onSchedule } from "firebase-functions/v2/scheduler";

export default onSchedule({ schedule: "0 7 * * *", region: "australia-southeast1", memory: "128MiB", cpu: 0.83 }, async () => {
	const sub = new PubSub();
	const json = { uuid: null, force: false };
	await sub.topic("projects/personal-finance-34aec/topics/insights", { batching: { maxMessages: 1 } }).publishMessage({ json });
});
