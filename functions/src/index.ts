import firebaseAdmin from "firebase-admin";
import { exportFunctions } from "better-firebase-functions";
import { sep } from "path";
import * as _ from "./utils.js";

firebaseAdmin.initializeApp();

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
