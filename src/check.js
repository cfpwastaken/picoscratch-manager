import "@total-typescript/ts-reset";
import { readFile } from "fs/promises";
import { TasksFile } from "./types/Task.js";
import { writeFileSync } from "fs";
export const tasks = JSON.parse(await readFile("tasks.json", "utf8"));
try {
    TasksFile.parse(tasks);
    console.log("Tasks are valid");
}
catch (e) {
    writeFileSync("taskerror.json", JSON.stringify(e, null, 2));
    console.error("Tasks are invalid");
}
