/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore } from "firebase-admin/firestore";
import { UserData, Transaction, CustomHttpsError, customErrorTypes } from "../types";
import { getTransactions } from "./transactions";
import { AuthData } from "firebase-functions/lib/common/providers/tasks";
import { getAffordability } from "./affordability";
import { getMonthlySummary } from "./summary";

export const getInsights = async (fsdb: Firestore, data: UserData, auth: AuthData) => {
	// Get Transactions
	let [transactions, userData] = await getTransactions(data);

	// Make sure affordability statement has been generated in the current month
	userData = await getAffordability(userData);

	// Make monthly summary based on current months transaction history
	userData = await getMonthlySummary(fsdb, transactions, auth, userData);

	// Update/set firebase user data on Firestore
	await updateUser(fsdb, auth, userData, transactions);
};

const updateUser = async (fsdb: Firestore, auth: AuthData, userData: UserData, transactions: Transaction[]) => {
	const batch = fsdb.batch();
	const userRef = fsdb.collection("users").doc(auth.uid);

	batch.set(userRef, userData, { merge: true });

	transactions.forEach((transaction) => {
		batch.create(userRef.collection("transactions").doc(), transaction);
	});

	try {
		await batch.commit();
	} catch (err: any) {
		console.log(err);
		throw CustomHttpsError.create(customErrorTypes.firestore, err);
	}
};
