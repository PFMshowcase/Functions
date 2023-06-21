/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore, Timestamp, getFirestore } from "firebase-admin/firestore";
import { CustomHttpsError, Transaction, UserData, customErrorTypes } from "./types";
import { initializeApp, apps } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

export const updateUser = async (fsdb: Firestore, uuid: string, userData: UserData, transactions: Transaction[]) => {
	const batch = fsdb.batch();
	const userRef = fsdb.collection("users").doc(uuid);

	batch.set(userRef, userData, { merge: true });

	transactions.forEach((transaction) => {
		batch.create(userRef.collection("transactions").doc(), transaction);
	});

	try {
		await batch.commit();
	} catch (err: any) {
		throw CustomHttpsError.create(customErrorTypes.firestore, err);
	}
};

export const initialize = () => {
	if (apps.length === 0) initializeApp();

	return { fsdb: getFirestore(), auth: getAuth() };
};

export const convertTimestampsToJson = <T extends object>(obj: T): T => {
	const newObj: any[keyof T] = {};
	const keys = Object.keys(obj) as Array<keyof T>;
	keys.forEach((key) => {
		const value = obj[key] as any;
		if (value instanceof Timestamp) {
			newObj[key] = { seconds: value.seconds, nanoseconds: value.nanoseconds };
		} else if (value instanceof Object) {
			newObj[key] = convertTimestampsToJson(value);
		} else {
			newObj[key] = value;
		}
	});

	return newObj;
};
