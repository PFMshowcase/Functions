import { Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import { CustomHttpsError, UserData, customErrorTypes } from "../../types.js";
import basiqApi from "../../api.js";
import { convertTimestampsToJson, updateUser } from "../../firebase.js";

import initialize from "../../utils.js";

export default onCall(
	{
		region: "australia-southeast1",
		memory: "256MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");
		if (!req.data.name || !req.data.email) {
			throw CustomHttpsError.create(customErrorTypes.generic, "invalid-argument", "Call must include users displayName and email");
		}

		const { fsdb } = await initialize();

		const id = await basiqApi.createUser(req.data.email, req.data.name);
		const token = await basiqApi.generateClientToken();

		const expiryDate = new Date();
		expiryDate.setMinutes(expiryDate.getMinutes() + 20);

		const userData: UserData = {
			basiq_user: {
				token: token,
				token_expiry: Timestamp.fromDate(expiryDate),
				uuid: id,
			},
			name: req.data.name,
			last_refresh: null,
			refreshing: false,
		};

		await updateUser(fsdb, req.auth.uid, userData, []);

		return convertTimestampsToJson(userData);
	}
);
