/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore, Timestamp } from "firebase-admin/firestore";
import basiqApi, { httpsMethods } from "../api.js";
import { CustomHttpsError, Transaction, UserData, customErrorTypes } from "../types.js";

export const getTransactions = async (fsdb: Firestore, userData: UserData, userId: string) => {
	// Check last transaction fetch

	// Get one month ago if no latest transaction
	if (!userData["latest-transaction"]) {
		const prevTenDays = new Date();
		const currentDayNum = prevTenDays.getDate();

		prevTenDays.setDate(currentDayNum - 5);

		userData["latest-transaction"] = Timestamp.fromDate(prevTenDays);
		userData["first-transaction"] = Timestamp.fromDate(prevTenDays);
	}

	const latestTransaction = userData["latest-transaction"]!;
	const filter = `?filter=transaction.postDate.gt('${latestTransaction.toDate().toISOStringDate()}'),transaction.status.eq('posted')`;

	const transactionsData = await basiqApi.req(httpsMethods.get, `/users/${userData["basiq-uuid"]}/transactions${filter}`);

	const transactions: [Transaction] = (transactionsData.data as [Transaction]) ?? [];

	userData["latest-transaction"] = Timestamp.now();

	const batch = fsdb.batch();
	const userRef = fsdb.collection("users").doc(userId);

	batch.update(userRef, userData);

	transactions.forEach((transaction) => {
		const formattedTransaction = transaction;

		const postDate = formattedTransaction.postDate;
		console.log(typeof postDate);
		if (typeof postDate === "string") {
			formattedTransaction.postDate = Timestamp.fromDate(new Date(transaction.postDate as string));
		}

		const ref = userRef.collection("transactions").doc();
		batch.create(ref, formattedTransaction);
	});

	try {
		await batch.commit();
	} catch (err: any) {
		console.log(err);
		throw CustomHttpsError.create(customErrorTypes.firestore, err);
	}
};
