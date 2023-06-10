/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from "axios";
import { FirebaseError } from "firebase-admin";
import { FunctionsErrorCode, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

export class CustomHttpsError {
	private constructor() {
		return;
	}

	public static create(type: customErrorTypes.firestore, err: FirebaseError): HttpsError;
	public static create(type: customErrorTypes.basiq, err: AxiosError): HttpsError;
	public static create(type: customErrorTypes.generic, ...err: errorInput): HttpsError;
	public static create(type: customErrorTypes, ...err: any): HttpsError {
		if (type === customErrorTypes.basiq) {
			const [axiosErr] = err as [AxiosError];

			const errData = (axiosErr.response?.data as any).data[0];
			const data: errorData = { type: type, basiqCode: errData["code"], basiqDetail: errData["detail"], basiqTitle: errData["title"] };

			return new HttpsError(basiqErrCodes[errData["code"] as string], errData["detail"], data);
		} else if (type === customErrorTypes.firestore) {
			const [fireErr] = err as [FirebaseError];

			return new HttpsError(fireErr.code as FunctionsErrorCode, fireErr.message, { type: type });
		} else if (type === customErrorTypes.generic) {
			const [code, message, data] = err as errorInput;

			return new HttpsError(code, message, { type: type, ...data });
		}

		return new HttpsError("internal", "This should not be returned", { type: customErrorTypes.generic });
	}
}

interface errorData {
	type: customErrorTypes;
	basiqCode?: string;
	basiqTitle?: string;
	basiqDetail?: string;
}

type errorInput = [code: FunctionsErrorCode, message: string, data?: any];

export enum customErrorTypes {
	firestore = "firestore",
	basiq = "basiq",
	generic = "generic",
}

// CSV and Bank statement errors are not included
const basiqErrCodes: { [key: string]: FunctionsErrorCode } = {
	"invalid-credentials": "invalid-argument",
	"too-many-sandbox-connections": "resource-exhausted",
	"internal-server-error": "internal",
	"access-denied": "permission-denied",
	"invalid-authorization-token": "invalid-argument",
	"parameter-not-supplied": "invalid-argument",
	"parameter-not-valid": "invalid-argument",
	"resource-not-found": "not-found",
	"resource-already-exists": "already-exists",
	"invalid-content": "invalid-argument",
	"unsupported-content-type": "invalid-argument",
	"unsupported-accept": "invalid-argument",
	"too-many-requests": "resource-exhausted",
	"method-not-allowed": "permission-denied",
	"unauthorized-access": "unauthenticated",
	"invalid-authorization-request": "invalid-argument",
	"no-production-access": "permission-denied",
	"account-not-accessible-requires-user-action": "permission-denied",
	"maintenance-error": "unavailable",
	"forbidden-access": "permission-denied",
	"institution-not-supported": "unimplemented",
	"request-not-valid": "invalid-argument",
	"missing-required-field": "invalid-argument",
	"missing-required-field-value": "invalid-argument",
	"invalid-field-value": "invalid-argument",
	"invalid-request-content": "invalid-argument",
};

export type UserData = {
	"basiq-uuid": string;
	"basiq-token": string;
	"basiq-token-expiry": Timestamp;
	name: { display: string | null; fName: string; lName: string };
	"first-transaction"?: Timestamp;
	"latest-transaction"?: Timestamp;
};

export type Transaction = {
	type: string;
	id: string;
	account: string;
	amount: string;
	balance: string;
	class: string;
	subClass?: { code?: string; title?: string };
	connection: string;
	description: string;
	enrich: {
		cleanDescription: string;
		tags: unknown;
		category: {
			anzsic?: {
				division?: details;
				subdivision?: details;
				group?: details;
				class?: details;
				subclass?: details;
			};
		};
		location: {
			country?: string;
			formattedAddress?: string;
			geometry?: {
				lat?: string;
				lng?: string;
			};
			postalCode?: string;
			route?: string;
			routeNo?: string;
			state?: string;
			suburb?: string;
		};
		merchant: merchant;
	};
	institution: string;
	postDate: string;
	status: string;
	transactionDate: string;
};

type details = {
	code?: string;
	title?: string;
};

type merchant = {
	id: string;
	businessName: string;
	ABN: string;
	logoMaster: string;
	logoThumb: string;
	phoneNumber?: {
		international?: string;
		local?: string;
	};
	website: string;
};
