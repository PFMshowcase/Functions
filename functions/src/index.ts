/* eslint-disable no-extend-native */
import firebaseAdmin from "firebase-admin";
import { exportFunctions } from "better-firebase-functions";
import { sep } from "path";

firebaseAdmin.initializeApp();

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

const formatPath = (relPath: string): string => {
	const relPathArray = relPath.split(sep);
	const fileName = relPathArray.pop() ?? "";
	const relDirPathFunctionNameChunk = relPathArray.map((pathFragment) => pathFragment.toLowerCase()).join(sep);
	const fileNameFunctionNameChunk = fileName.toLowerCase().split(".")[0];
	const funcName = relDirPathFunctionNameChunk ? `${relDirPathFunctionNameChunk}${sep}${fileNameFunctionNameChunk}` : fileNameFunctionNameChunk;
	return funcName.split(sep).join("-");
};

exportFunctions({
	__filename,
	exports,
	searchGlob: "**/**.f.{ts,js}",
	functionDirectoryPath: "./functions",
	funcNameFromRelPath: formatPath,
});
