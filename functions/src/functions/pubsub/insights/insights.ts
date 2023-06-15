import { Firestore } from "firebase-admin/firestore";
import { UserData } from "../../../types";
import { getTransactions } from "./transactions";
import { getAffordability } from "./affordability";
import { getMonthlySummary } from "./summary";
import { updateUser } from "../../../firebase";

export const getInsights = async (fsdb: Firestore, data: UserData, uuid: string) => {
	// Get Transactions
	let [transactions, userData] = await getTransactions(data);

	// Make sure affordability statement has been generated in the current month
	userData = await getAffordability(userData);

	// Make monthly summary based on current months transaction history
	userData = await getMonthlySummary(fsdb, transactions, uuid, userData);

	// Update/set firebase user data on Firestore
	await updateUser(fsdb, uuid, userData, transactions);
};
