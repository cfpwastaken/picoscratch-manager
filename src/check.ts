import "@total-typescript/ts-reset";
import { readFile } from "fs/promises";
import { Tasks } from "./types/Task.js";
import { writeFileSync } from "fs";

export const tasks = JSON.parse(await readFile("tasks.json", "utf8"));

try {
	Tasks.parse(tasks);
	console.log("Tasks are valid");
} catch (e) {
	writeFileSync("taskerror.json", JSON.stringify(e, null, 2));
	console.error("Tasks are invalid");
}
