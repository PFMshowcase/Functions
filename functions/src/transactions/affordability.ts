import { Affordability, UserData } from "../types";
import basiqApi, { httpsMethods } from "../api.js";

export const getAffordability = async (userData: UserData) => {
	const date = new Date(Date.now());
	const currentMonthCompare = `${date.getFullYear()}-${date.getMonth()}`;

	if (!userData.basiq_affordability || userData.basiq_affordability.fromMonth !== currentMonthCompare) {
		userData.basiq_affordability = (await basiqApi.req(httpsMethods.post, `/users/${userData.basiq_user.uuid}/affordability`)) as Affordability;
	}

	return userData;
};
