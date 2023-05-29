import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

exports.createuser = onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	(req) => {
		logger.log(req.data);
		logger.log("called");
	}
);
