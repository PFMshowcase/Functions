/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import { CustomHttpsError, customErrorTypes } from "../../types.js";
import basiqApi from "../../api.js";
import { getInsights } from "../../transactions/insights.js";

export default onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");
		if (!req.data.name || !req.data.email) {
			throw CustomHttpsError.create(customErrorTypes.generic, "invalid-argument", "Call must include users displayName and email");
		}

		const fsdb = getFirestore();

		await basiqApi.initialize(defineString("BASIQ_KEY").value());
		const id = await basiqApi.createUser(req.data.email, req.data.name);
		const token = await basiqApi.generateClientToken();

		const expiryDate = new Date();
		expiryDate.setMinutes(expiryDate.getMinutes() + 20);

		await getInsights(
			fsdb,
			{ "basiq-token": token, "basiq-token-expiry": Timestamp.fromDate(expiryDate), "basiq-uuid": id, name: req.data.name },
			req.auth
		);

		return {
			"basiq-uuid": id,
			"basiq-token": token,
			"basiq-token-expiry": Timestamp.fromDate(expiryDate).seconds,
		};
	}
);