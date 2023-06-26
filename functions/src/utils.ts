/* eslint-disable no-extend-native */
import { CustomHttpsError, customErrorTypes } from "./types";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { initializeApp, apps } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { defineString } from "firebase-functions/params";
import basiqApi from "./api";

declare global {
	interface Date {
		toISOStringDate: () => string;
	}

	interface DateConstructor {
		getDaysAgo: (numDays: number) => Date;
	}
}

if (!Date.prototype.toISOStringDate) {
	// prettier-ignore
	Date.prototype.toISOStringDate = function(): string {
		return this.getFullYear() + "-" + ("0" + (this.getMonth() + 1)).slice(-2) + "-" + ("0" + this.getDate()).slice(-2);
	};
}

if (!Date.getDaysAgo) {
	Date.getDaysAgo = (numDays: number): Date => {
		const date = new Date();
		date.setDate(date.getDate() - numDays);
		return date;
	};
}

export const deepCopy = <T>(obj: T): T => {
	if (obj === null || typeof obj !== "object") return obj;

	if (obj instanceof Date) {
		const copy = new Date();
		copy.setTime(obj.getTime());
		return copy as T;
	}

	if (obj instanceof Timestamp) {
		return new Timestamp(obj.seconds, obj.nanoseconds) as T;
	}

	if (obj instanceof Array) return obj.map((item) => deepCopy(item)) as T;

	if (obj instanceof Object) {
		const copy: T = {} as T;

		for (const attr in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, attr)) copy[attr] = deepCopy(obj[attr]);
		}

		return copy;
	}

	console.log("Unable to copy obj, type is not supported");
	throw CustomHttpsError.create(customErrorTypes.generic, "internal", "Unable to copy obj, type is not supported");
};

export default async () => {
	// Init Firebase
	if (apps.length === 0) initializeApp();

	// Init Basiq API
	await basiqApi.initialize(defineString("BASIQ_KEY").value());

	return { fsdb: getFirestore(), auth: getAuth() };
};
