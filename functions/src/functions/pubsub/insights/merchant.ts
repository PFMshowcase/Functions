import { Firestore } from "firebase-admin/firestore";
import { MerchantCategories, MerchantCategory, Transaction } from "../../../types";
import { deepCopy } from "../../../utils";

export const getMerchantData = async (
	fsdb: Firestore,
	transactions: Transaction[],
	uuid: string,
	merchantCategories: MerchantCategories
): Promise<{ transactions: Transaction[]; allTransactions: Transaction[] }> => {
	const oldTransactionData = await fsdb.collection("users").doc(uuid).collection("transactions").get();
	const allTransactions = deepCopy(transactions);

	oldTransactionData.forEach((doc) => {
		allTransactions.push(doc.data() as Transaction);
	});

	const unknownTransactions: { [key: string]: { code?: string; description?: string } } = {};

	const updatedTransactions = allTransactions.reduce((all, val) => {
		if (!val.categoryIcon || !val.categoryInfo || val.categoryInfo.unknown === true) {
			const category = getCategory(merchantCategories, val.subClass);

			if (typeof category === "string" && category !== val.categoryIcon) {
				val.categoryIcon = category;
				unknownTransactions[val.subClass.code ?? Math.random() * -100] = val.subClass;
				return [...all, val];
			} else if (typeof category !== "string") {
				val.categoryIcon = category.iosIcon;
				val.categoryInfo = category;
				return [...all, val];
			}
		}

		return all;
	}, [] as Transaction[]);

	await fsdb.collection("merchantCategories").doc("unknownCodes").set(unknownTransactions, { merge: true });

	return { transactions: updatedTransactions, allTransactions };
};

const getCategory = (merchantCategories: MerchantCategories, transactionCategory: { code?: string; title?: string }): MerchantCategory => {
	if (transactionCategory.code && transactionCategory.title && Object.keys(merchantCategories).includes(transactionCategory.code)) {
		return merchantCategories[transactionCategory.code];
	} else if (transactionCategory.code && transactionCategory.title) {
		const code = parseInt(transactionCategory.code);

		if (code >= 700) {
			return { code: transactionCategory.code, description: transactionCategory.title, iosIcon: "wrench.and.screwdriver", unknown: true };
		} else if (code >= 400) return { code: transactionCategory.code, description: transactionCategory.title, iosIcon: "bag", unknown: true };
	}

	return { code: transactionCategory.code ?? "0", description: transactionCategory.title ?? "unkown", iosIcon: "circle.dashed", unknown: true };
};
