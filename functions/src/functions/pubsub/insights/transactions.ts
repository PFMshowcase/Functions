/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase-admin/firestore";
import basiqApi, { httpsMethods } from "../../../api.js";
import { Transaction, UserData } from "../../../types.js";

export const getTransactions = async (userData: UserData): Promise<[Transaction[], UserData, { code: string; description: string }[]]> => {
	// Get one month ago if no latest transaction
	if (!userData.basiq_transactions?.latest_transaction) {
		const prevMonth = new Date();
		prevMonth.setDate(prevMonth.getMonth() - 1);

		userData.basiq_transactions = { latest_transaction: Timestamp.fromDate(prevMonth), first_transaction: Timestamp.fromDate(prevMonth) };
	}

	const unknownMerchantCategories: { code: string; description: string }[] = [];

	const latestTransaction = userData.basiq_transactions.latest_transaction!;
	const filter = `?filter=transaction.postDate.gt('${latestTransaction.toDate().toISOStringDate()}'),transaction.status.eq('posted')`;

	const transactionsData = await basiqApi.req(httpsMethods.get, `/users/${userData.basiq_user.uuid}/transactions${filter}`);
	const transactions = (transactionsData.data as [{ [key: string]: any }]).map<Transaction>((val) => {
		val.postDate = Timestamp.fromDate(new Date(val.postDate as string));

		return val as Transaction;
	});

	userData.basiq_transactions.latest_transaction = Timestamp.now();

	return [transactions, userData, unknownMerchantCategories];
};
