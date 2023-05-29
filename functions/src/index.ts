import { onCall, HttpsError } from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

exports.setupUser = onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	(req) => {
		if (!req.auth) return new HttpsError("unauthenticated", "Call must be made by an authenticated user");

		return;
	}
);
