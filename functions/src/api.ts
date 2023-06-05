/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from "qs";
import axios, { AxiosRequestConfig } from "axios";
import { DocumentData, Firestore, Timestamp, getFirestore } from "firebase-admin/firestore";
import { CustomHttpsError, customErrorTypes } from "./types.js";

class BasiqAPI {
	private static instance: BasiqAPI;

	private _apiKey?: string;
	private _token?: string;
	userId?: string;
	private _version = "3.0";
	private _fsdb?: Firestore;

	// Prevent direct construction calls with the `new` parameter
	private constructor() {
		return;
	}

	// Singleton access
	public static getInstance(): BasiqAPI {
		if (!BasiqAPI.instance) {
			BasiqAPI.instance = new BasiqAPI();
		}

		return BasiqAPI.instance;
	}

	public initialize = async (apiKey: string) => {
		this._fsdb = getFirestore();
		this._apiKey = apiKey;

		let tokenDoc: DocumentData;

		try {
			tokenDoc = await this._fsdb.collection("admin").doc("basiq-token").get();
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		if (!tokenDoc.exists) return this.generateServerToken();

		const tokenData = tokenDoc.data();
		const currentTimestamp = Timestamp.fromDate(new Date());

		if (!tokenData || tokenData["expires"] < currentTimestamp) return this.generateServerToken();

		this._token = tokenData["value"];
		return tokenData["value"];
	};

	public createUser = async (email: string, name: { fName: string; lName: string; display?: string }): Promise<string> => {
		const data = { email: email, firstName: name.fName, lastName: name.lName };
		const config = this.createConfig(httpsMethods.post, "/users", data, { accept: "application/json", contentType: "application/json" });

		try {
			const res = await axios(config);

			this.userId = res.data.id;
			return res.data.id as string;
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.basiq, err);
		}
	};

	public generateClientToken = async () => await this.generateToken(tokenScope.client);
	public generateServerToken = async () => {
		if (!this._fsdb) throw CustomHttpsError.create(customErrorTypes.generic, "internal", "Must initialize class first");
		this._token = await this.generateToken(tokenScope.server);

		const expiryDate = new Date();
		expiryDate.setMinutes(expiryDate.getMinutes() + 20);
		const reqData = { value: this._token, expires: Timestamp.fromDate(expiryDate) };

		try {
			await this._fsdb.collection("admin").doc("basiq-token").set(reqData);
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.firestore, err);
		}

		return this._token;
	};

	private generateToken = async (scope: tokenScope): Promise<string> => {
		if (!this._apiKey) throw CustomHttpsError.create(customErrorTypes.generic, "internal", "Api key required");
		if (!this.userId && scope === tokenScope.client) throw CustomHttpsError.create(customErrorTypes.generic, "internal", "UserId required");

		const data: { scope: tokenScope; userId?: string } = { scope: scope };

		if (scope === tokenScope.client) data.userId = this.userId;

		const encodedData = qs.stringify(data);

		const config = this.createConfig(httpsMethods.post, "/token", encodedData, {
			auth: `Basic ${this._apiKey}`,
			contentType: "application/x-www-form-urlencoded",
		});

		try {
			const res = await axios(config);

			return res.data.access_token as string;
		} catch (err: any) {
			throw CustomHttpsError.create(customErrorTypes.basiq, err);
		}
	};

	private createConfig = (method: httpsMethods, path: string, data?: unknown, metadata?: configMetadata): AxiosRequestConfig => {
		const config: AxiosRequestConfig = { method: method, url: `https://au-api.basiq.io${path}` };
		config.headers = { "basiq-version": this._version };

		config.headers["Authorization"] = metadata?.auth ? metadata?.auth : `Bearer ${this.token}`;
		if (metadata?.contentType) config.headers["Content-Type"] = metadata?.contentType;
		if (metadata?.accept) config.headers["Accept"] = metadata?.accept;

		if (data) config.data = data;

		return config;
	};

	// Getters and Setters
	public get token() {
		return this._token;
	}

	public set version(version: string) {
		console.log(version, version.length);
		const regexp = new RegExp(/^\d{1,2}\.\d{1,2}$/);
		if (regexp.test(version)) this._version = version;
		else throw CustomHttpsError.create(customErrorTypes.generic, "internal", "Version string is not valid");
	}
}

enum tokenScope {
	client = "CLIENT_ACCESS",
	server = "SERVER_ACCESS",
}

enum httpsMethods {
	post = "post",
	get = "get",
	put = "put",
	patch = "patch",
	delete = "delete",
}

type configMetadata = {
	auth?: string;
	contentType?: string;
	accept?: string;
};

export default BasiqAPI.getInstance();
