/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import { CustomHttpsError, customErrorTypes, UserData } from "../../types.js";
import basiqApi from "../../api.js";
import { convertTimestampsToJson, initialize, updateUser } from "../../firebase.js";
import { PubSub } from "@google-cloud/pubsub";

export default onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");

		const { fsdb } = initialize();

		await basiqApi.initialize(defineString("BASIQ_KEY").value());

		let data: UserData;

		try {
			data = (await fsdb.collection("users").doc(req.auth.uid).get()).data() as UserData;
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		if (!data) throw CustomHttpsError.create(customErrorTypes.generic, "not-found", "Basiq user not found");

		basiqApi.userId = data.basiq_user.uuid;

		if (data.basiq_user.token_expiry < Timestamp.now()) {
			// create token
			data.basiq_user.token = await basiqApi.generateClientToken();

			const expiryDate = new Date();
			expiryDate.setMinutes(expiryDate.getMinutes() + 20);
			data.basiq_user.token_expiry = Timestamp.fromDate(expiryDate);
		}

		await updateUser(fsdb, req.auth.uid, data, []);

		// 21,600,000 is 6 hours worth of ms - checking if it was last refreshed more than 6 hours ago
		if (!data.last_refresh || data.last_refresh.toDate().getTime() < new Date().getTime() - 21600000) {
			const pub = new PubSub();
			const json = { uuid: req.auth.uid, force: true };
			await pub.topic("projects/personal-finance-34aec/topics/insights", { batching: { maxMessages: 1 } }).publishMessage({ json });
		}

		return convertTimestampsToJson(data);
	}
);
