/* eslint-disable @typescript-eslint/no-explicit-any */
import { onCall } from "firebase-functions/v2/https";
import firebaseAdmin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import basiqApi from "./api.js";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { CustomHttpsError, customErrorTypes } from "./types.js";

firebaseAdmin.initializeApp();

const fsdb = getFirestore();

export const setupuser = onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");
		if (!req.data.name || !req.data.email) {
			throw CustomHttpsError.create(customErrorTypes.generic, "invalid-argument", "Call must include users displayName and email");
		}

		await basiqApi.initialize(defineString("BASIQ_KEY").value());
		const id = await basiqApi.createUser(req.data.email, req.data.name);
		const token = await basiqApi.generateClientToken();

		const expiryDate = new Date();
		expiryDate.setMinutes(expiryDate.getMinutes() + 20);

		try {
			await fsdb
				.collection("users")
				.doc(req.auth.uid)
				.set({ "basiq-token": token, "basiq-uuid": id, "basiq-token-expiry": Timestamp.fromDate(expiryDate), name: req.data.name });
		} catch (err: any) {
			return CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		return {
			"basiq-uuid": id,
			"basiq-token": token,
			"basiq-token-expiry": Timestamp.fromDate(expiryDate).seconds,
		};
	}
);

export const loginuser = onCall(
	{
		region: "australia-southeast1",
		memory: "128MiB",
		cpu: 0.83,
	},
	async (req) => {
		if (!req.auth) throw CustomHttpsError.create(customErrorTypes.generic, "unauthenticated", "Call must be made by an authenticated user");

		await basiqApi.initialize(defineString("BASIQ_KEY").value());
		type DataType = {
			"basiq-uuid": string;
			"basiq-token": string;
			"basiq-token-expiry": Timestamp;
			name: { display: string | null; fName: string; lName: string };
		};
		let data: DataType;

		try {
			const userDoc = await fsdb.collection("users").doc(req.auth.uid).get();
			data = userDoc.data() as DataType;
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		if (!data) throw CustomHttpsError.create(customErrorTypes.generic, "not-found", "Basiq user not found");

		basiqApi.userId = data["basiq-uuid"];

		if (data["basiq-token-expiry"] < Timestamp.now()) {
			// create
			const token = await basiqApi.generateClientToken();

			const expiryDate = new Date();
			expiryDate.setMinutes(expiryDate.getMinutes() + 20);
			const expiry = Timestamp.fromDate(expiryDate);

			try {
				await fsdb.collection("users").doc(req.auth.uid).update({ "basiq-token": token, "basiq-token-expiry": expiry });
			} catch (err: any) {
				return CustomHttpsError.create(customErrorTypes.firestore, err);
			}

			return { "basiq-uuid": data["basiq-uuid"], "basiq-token": token, "basiq-token-expiry": expiry.seconds, name: data["name"] };
		} else {
			return {
				"basiq-uuid": data["basiq-uuid"],
				"basiq-token": data["basiq-token"],
				"basiq-token-expiry": data["basiq-token-expiry"].seconds,
				name: data["name"],
			};
		}
	}
);
