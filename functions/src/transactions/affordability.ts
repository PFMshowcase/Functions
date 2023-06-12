import { Affordability, UserData } from "../types";
import basiqApi, { httpsMethods } from "../api.js";

export const getAffordability = async (userData: UserData) => {
	const date = new Date(Date.now());
	const currentMonthCompare = `${date.getFullYear()}-${date.getMonth()}`;

	if (!userData.affordability || userData.affordability.fromMonth !== currentMonthCompare) {
		const affordabilityData = await basiqApi.req(httpsMethods.post, `/users/${userData["basiq-uuid"]}/affordability}`);
		userData.affordability = affordabilityData as Affordability;
	}

	return userData;
};
