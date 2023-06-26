import { Firestore, Timestamp } from "firebase-admin/firestore";
import { MerchantCategories, UserData } from "../../../types";
import { getTransactions } from "./transactions";
import { getAffordability } from "./affordability";
import { getMonthlySummary } from "./summary";
import { updateUser } from "../../../firebase";
import { getMerchantData } from "./merchant";

export const getInsights = async (fsdb: Firestore, data: UserData, uuid: string, merchantCategories: MerchantCategories = {}) => {
	// Get Transactions
	let [newTransactions, userData] = await getTransactions(data);

	// Make sure affordability statement has been generated in the current month
	userData = await getAffordability(userData);

	const { transactions, allTransactions } = await getMerchantData(fsdb, newTransactions, uuid, merchantCategories);

	// Make monthly summary based on current months transaction history
	userData = await getMonthlySummary(fsdb, allTransactions, userData);

	userData.refreshing = false;
	userData.last_refresh = Timestamp.now();

	// Update/set firebase user data on Firestore
	await updateUser(fsdb, uuid, userData, transactions);
};
