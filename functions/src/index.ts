/* eslint-disable @typescript-eslint/no-explicit-any */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

import basiqApi, { tokenScope } from "./api.js";

export const setupuser = onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) return new HttpsError("unauthenticated", "Call must be made by an authenticated user");

		basiqApi.apiKey = defineString("BASIQ_KEY").value();
		console.log(await basiqApi.generateToken(tokenScope.server));

		return;
	}
);
