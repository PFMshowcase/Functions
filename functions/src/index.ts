/* eslint-disable no-extend-native */
import firebaseAdmin from "firebase-admin";
import { setupuser } from "./setupuser.js";
import { loginuser } from "./loginuser.js";

firebaseAdmin.initializeApp();

declare global {
	interface Date {
		toISOStringDate: () => string;
	}
}

if (!Date.prototype.toISOStringDate) {
	// prettier-ignore
	Date.prototype.toISOStringDate = function(): string {
		return this.getFullYear() + "-" + ("0" + (this.getMonth() + 1)).slice(-2) + "-" + ("0" + this.getDate()).slice(-2);
	};
}

export { setupuser, loginuser };
