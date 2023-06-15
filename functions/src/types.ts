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
	name: { display: string | null; first: string; last: string };
	basiq_user: {
		uuid: string;
		token: string;
		token_expiry: Timestamp;
	};
	last_refresh: Timestamp | null;
	refreshing: boolean;
	basiq_transactions?: {
		first_transaction: Timestamp;
		latest_transaction: Timestamp;
	};
	basiq_affordability?: Affordability;
	summary?: {
		monthly_income: number;
		monthly_expenses: number;
		monthly_net: number;
	};
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
	postDate: Timestamp;
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

export type Affordability = {
	id: string;
	coverageDays: number;
	assets: [AffordabilityAsset];
	external: [AffordabilityExternal];
	fromMonth: string;
	toMonth: string;
	generatedDate: string;
	liabilities: AffordabilityLiability;
	summary: AffordabilitySummary;
};

type AffordabilityAsset = {
	type: string;
	account: AffordabilityAccount;
	availableFunds: string;
	balance: string;
	currency: string;
	institution: string;
	previous6Months: {
		maxBalance: string | null;
		minBalance: string | null;
	};
};

type AffordabilitySummary = {
	assets: string | null;
	creditLimit: string | null;
	expenses: string;
	liabilities: string | null;
	loanRepaymentMonthly: string | null;
	netPosition: string | null;
	potentialLiabilitiesMonthly: string | null;
	regularIncome: {
		previous3Months: {
			avgMonthly: string | null;
		};
	};
	savings: string | null;
};

type AffordabilityExternal = {
	changeHistory: [
		{
			amount: string;
			date: Date;
			source: string;
		}
	];
	payments: [
		{
			amountAvg: string;
			amountAvgMonthly: string;
			first: Date;
			last: Date;
			noOccurrences: number;
			total: string;
		}
	];
	source: string;
};

type AffordabilityLiability = {
	credit: [
		{
			account: AffordabilityAccount;
			availableFunds: string | null;
			balance: string | null;
			creditLimit: string | null;
			currency: string;
			institution: string;
			previous6Months: {
				cashAdvances: string;
			};
			previousMonth: {
				maxBalance: string;
				minBalance: string;
				totalCredits: string;
				totalDebits: string;
			};
		}
	];
	loan: [
		{
			account: AffordabilityAccount;
			availableFunds: string | null;
			balance: string | null;
			changeHistory: [
				{
					amount: string;
					date: Date;
					direction: string;
					source: string;
				}
			];
			currency: string;
			institution: string;
			previous6Months: {
				arrears: string | null;
			};
			previousMonth: {
				totalCredits: string;
				totalDebits: string;
				totalInterestCharged: string;
				totalRepayments: string;
			};
		}
	];
};

type AffordabilityAccount = {
	product: string;
	type: string;
};
