/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import { CustomHttpsError, customErrorTypes, UserData } from "../types.js";
import basiqApi from "../api.js";
import { getInsights } from "../insights/insights.js";

export default onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");

		const fsdb = getFirestore();

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

		await getInsights(fsdb, data, req.auth);

		return {
			"basiq-uuid": data.basiq_user.uuid,
			"basiq-token": data.basiq_user.token,
			"basiq-token-expiry": data.basiq_user.token_expiry.seconds,
			name: data.name,
		};
	}
);
