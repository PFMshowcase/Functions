import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getInsights } from "./insights/insights";
import { UserRecord } from "firebase-admin/auth";
import { UserData } from "../../types";
import { initialize } from "../../firebase";
import basiqApi from "../../api";
import { defineString } from "firebase-functions/params";

export default onMessagePublished(
	{ topic: "projects/personal-finance-34aec/topics/insights", region: "australia-southeast1", memory: "128MiB", cpu: 0.83 },
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

		const pastWeek = new Date();
		pastWeek.setDate(pastWeek.getDate() - 7);

		await Promise.all(
			users.map(async (user) => {
				const lastRefresh = new Date(user.metadata.lastSignInTime);
				if ((lastRefresh && lastRefresh > pastWeek) || data.force) {
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
