import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getInsights } from "./insights/insights";
import { UserRecord } from "firebase-admin/auth";
import { UserData } from "../../types";
import { initialize } from "../../firebase";
import basiqApi from "../../api";
import { defineString } from "firebase-functions/params";

export default onMessagePublished(
	{ topic: "projects/personal-finance-34aec/topics/insights", region: "australia-southeast1", memory: "512MiB", cpu: 1, retry: false },
	async (event) => {
		const { fsdb, auth } = initialize();
		await basiqApi.initialize(defineString("BASIQ_KEY").value());

		console.log(event.data.message.json, event.data.message.data, typeof event.data.message.json);
		const data = event.data.message.json as { uuid?: string; force?: boolean };

		let users: UserRecord[];
		if (data.uuid) {
			users = [await auth.getUser(data.uuid)];
		} else {
			users = (await auth.listUsers()).users;
		}

		console.log(users.length);

		await Promise.all(
			users.map(async (user) => {
				const lastRefresh = new Date(user.metadata.lastSignInTime);
				// Check user was last refreshed this week but not in the last 6 hours
				// or if force is set to true
				if ((lastRefresh < Date.getDaysAgo(7) && lastRefresh > new Date(Date.now() - 21600000)) || data.force) {
					const userRef = fsdb.collection("users").doc(user.uid);
					const userData = (await userRef.get()).data() as UserData | undefined;
					await userRef.update({ refreshing: true });
					if (userData) await getInsights(fsdb, userData, user.uid);
				}
				return;
			})
		);
	}
);
