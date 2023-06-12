import { Firestore } from "firebase-admin/firestore";
import { Transaction, UserData } from "../types";
import { AuthData } from "firebase-functions/lib/common/providers/tasks";

export const getMonthlySummary = async (fsdb: Firestore, transactions: Transaction[], auth: AuthData, userData: UserData): Promise<UserData> => {
	let monthlyIncome = 0.0;
	let monthlyExpenses = 0.0;

	const oldTransactionData = await fsdb.collection("users").doc(auth.uid).collection("transactions").get();
	const allTransactions = transactions;
	oldTransactionData.forEach((doc) => {
		allTransactions.push(doc.data() as Transaction);
	});

	allTransactions.forEach((transaction) => {
		if (transaction.postDate.toDate().getMonth() === new Date(Date.now()).getMonth()) {
			const amount = parseFloat(transaction.amount);
			if (amount >= 0) {
				monthlyIncome += amount;
			} else {
				monthlyExpenses += amount;
			}
		}
	});

	return { ...userData, summary: { monthly_expenses: monthlyExpenses, monthly_income: monthlyIncome, monthly_net: monthlyExpenses + monthlyIncome } };
};
