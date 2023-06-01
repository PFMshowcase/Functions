/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from "qs";
import axios, { AxiosRequestConfig } from "axios";

class BasiqAPI {
	private static instance: BasiqAPI;

	apiKey?: string;
	token?: string;
	userId?: string;
	version = "3.0";

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

	public generateToken = async (scope: tokenScope) => {
		if (!this.apiKey) throw new Error("Api key required");
		if (!this.userId && scope === tokenScope.client) throw new Error("UserId required");

		const data: { scope: tokenScope; userId?: string } = { scope: scope };

		if (scope === tokenScope.client) data.userId = this.userId;

		const encodedData = qs.stringify(data);

		const config = this.createConfig(httpsMethods.post, "/token", encodedData, {
			auth: `Basic ${this.apiKey}`,
			contentType: "application/x-www-form-urlencoded",
		});

		const res = await axios(config);

		if (scope === tokenScope.server) this.token = res.data.access_token;
		return res.data.access_token;
	};

	private createConfig = (method: httpsMethods, path: string, data?: unknown, metadata?: configMetadata): AxiosRequestConfig => {
		const config: AxiosRequestConfig = { method: method, url: `https://au-api.basiq.io${path}` };
		config.headers = { "basiq-version": "3.0" };

		config.headers["Authorization"] = metadata?.auth ? metadata?.auth : `Bearer ${this.token}`;
		if (metadata?.contentType) config.headers["Content-Type"] = metadata?.contentType;
		if (metadata?.accept) config.headers["Accept"] = metadata?.accept;

		if (data) config.data = data;

		return config;
	};
}

export enum tokenScope {
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
