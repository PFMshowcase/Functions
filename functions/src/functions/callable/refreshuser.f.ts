import { onCall } from "firebase-functions/v2/https";
import { CustomHttpsError, customErrorTypes } from "../../types";
import { PubSub } from "@google-cloud/pubsub";

export default onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");

		const pub = new PubSub();
		const json = { uuid: req.auth.uid, force: true };
		await pub.topic("projects/personal-finance-34aec/topics/insights", { batching: { maxMessages: 1 } }).publishMessage({ json });
	}
);
