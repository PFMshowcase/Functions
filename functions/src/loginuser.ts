/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import { CustomHttpsError, customErrorTypes, UserData } from "./types.js";
import basiqApi from "./api.js";
import { getTransactions } from "./transactions.js";

export const loginuser = onCall(
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
			const userDoc = await fsdb.collection("users").doc(req.auth.uid).get();
			data = userDoc.data() as UserData;
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		if (!data) throw CustomHttpsError.create(customErrorTypes.generic, "not-found", "Basiq user not found");

		basiqApi.userId = data["basiq-uuid"];

		if (data["basiq-token-expiry"] < Timestamp.now()) {
			// create
			const token = await basiqApi.generateClientToken();

			const expiryDate = new Date();
			expiryDate.setMinutes(expiryDate.getMinutes() + 20);
			const expiry = Timestamp.fromDate(expiryDate);

			await getTransactions(fsdb, { ...data, "basiq-token": token, "basiq-token-expiry": expiry }, req.auth.uid);

			return { "basiq-uuid": data["basiq-uuid"], "basiq-token": token, "basiq-token-expiry": expiry.seconds, name: data["name"] };
		} else {
			await getTransactions(fsdb, data, req.auth.uid);

			return {
				"basiq-uuid": data["basiq-uuid"],
				"basiq-token": data["basiq-token"],
				"basiq-token-expiry": data["basiq-token-expiry"].seconds,
				name: data["name"],
			};
		}
	}
);
