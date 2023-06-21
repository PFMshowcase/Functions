/* eslint-disable @typescript-eslint/no-explicit-any */
import { Affordability, CustomHttpsError, UserData, customErrorTypes } from "../../../types";
import basiqApi, { httpsMethods } from "../../../api.js";
import { HttpsError } from "firebase-functions/v2/https";

export const getAffordability = async (userData: UserData) => {
	const date = new Date(Date.now());
	const currentMonthCompare = `${date.getFullYear()}-${date.getMonth()}`;

	if (!userData.basiq_affordability || userData.basiq_affordability.fromMonth !== currentMonthCompare) {
		try {
			userData.basiq_affordability = (await basiqApi.req(httpsMethods.post, `/users/${userData.basiq_user.uuid}/affordability`)) as Affordability;
		} catch (err: any) {
			if (err instanceof HttpsError) {
				if (err.httpErrorCode.status === 404) {
					console.log(`${err.httpErrorCode.status}-${err.code}-${err.message}`);
				} else {
					throw err;
				}
			} else {
				throw CustomHttpsError.create(customErrorTypes.generic, "internal", err.name, { message: err.message });
			}
		}
	}

	return userData;
};
