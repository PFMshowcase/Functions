import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getInsights } from "./insights/insights";
import { UserRecord } from "firebase-admin/auth";
import { MerchantCategories, UserData } from "../../types";
import initialize from "../../utils.js";

export default onMessagePublished(
	{ topic: "projects/personal-finance-34aec/topics/insights", region: "australia-southeast1", memory: "512MiB", cpu: 1, retry: false },
	async (event) => {
		const { fsdb, auth } = await initialize();

		const data = event.data.message.json as { uuid?: string; force?: boolean };

		let users: UserRecord[];
		if (data.uuid) {
			users = [await auth.getUser(data.uuid)];
		} else {
			users = (await auth.listUsers()).users;
		}

		const merchantCategoryIcons = (await fsdb.collection("merchantCategories").doc("icons").get()).data() as MerchantCategories | undefined;

		await Promise.all(
			users.map(async (user) => {
				const lastRefresh = new Date(user.metadata.lastSignInTime);
				// Check user was last refreshed this week but not in the last 6 hours
				// or if force is set to true
				if ((lastRefresh < Date.getDaysAgo(7) && lastRefresh > new Date(Date.now() - 21600000)) || data.force) {
					const userRef = fsdb.collection("users").doc(user.uid);
					const userData = (await userRef.get()).data() as UserData | undefined;
					await userRef.update({ refreshing: true });
					if (userData) await getInsights(fsdb, userData, user.uid, merchantCategoryIcons);
				}
				return;
			})
		);
	}
);
