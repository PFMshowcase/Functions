import { Firestore } from "firebase-admin/firestore";
import { CustomHttpsError, Transaction, UserData, customErrorTypes } from "../../../types";

export const getMonthlySummary = async (fsdb: Firestore, allTransactions: Transaction[], userData: UserData): Promise<UserData> => {
	if (!userData.basiq_affordability) {
		throw CustomHttpsError.create(customErrorTypes.generic, "not-found", "Could not get Affordability statement for summary");
	}

	let monthlyIncome = 0.0;
	let monthlyExpenses = 0.0;

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

	const avgExpenses = parseFloat(userData.basiq_affordability.summary.expenses);
	const avgIncomeStr = userData.basiq_affordability.summary.regularIncome.previous3Months.avgMonthly;
	const avgSavingsStr = userData.basiq_affordability.summary.savings;

	const avgSavings = avgSavingsStr ? parseFloat(avgSavingsStr) : null;
	const avgIncome = avgIncomeStr ? parseFloat(avgIncomeStr) : null;

	const summary: UserData["summary"] = {
		month_avg_expenses: Math.abs(avgExpenses),
		month_avg_income: avgIncome,
		month_avg_savings: avgSavings,
		month_to_date_expenses: Math.abs(monthlyExpenses),
		month_to_date_income: monthlyIncome,
		month_to_date_savings: monthlyExpenses + monthlyIncome,
	};

	return { ...userData, summary };
};
