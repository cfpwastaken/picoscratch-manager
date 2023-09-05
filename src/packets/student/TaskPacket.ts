import z from "zod";
import { Connection } from "../../connection.js";
import { WebSocket } from "ws";
import { capitalizeWords, getTasksForCourse, studentLevelpath, studentSections } from "../../utils.js";
import { demoTasks, codingTasks } from "../../main.js";

export const InTaskPacket = z.object({
	type: z.literal("task"),
	level: z.number(),
	section: z.number()
});

export type InTaskPacket = z.infer<typeof InTaskPacket>;

export async function handleTaskPacket(packet: InTaskPacket, con: Connection, ws: WebSocket) {
	const course = await con.room.$get("course");
	if(course == null) return;
	if(!course.isRunning) {
		ws.send(JSON.stringify({type: "task", success: false, error: "Course is not running"}));
		return;
	}
	const s = await course.$get("students");
	const student = s.find(s => s.name == capitalizeWords(con.name.split(" ")).join(" ")) || null;
	if(!student) return;
	const courseTasks = await getTasksForCourse(course.uuid);
	if(!(packet.section <= student.section)) {
		ws.send(JSON.stringify({type: "task", success: false, error: "You have not completed the previous section yet"}));
		ws.send(JSON.stringify({type: "sections", ...studentSections(student, courseTasks)}));
		return;
	}
	if(student.section == packet.section) {
		if(!(packet.level <= student.level)) {
			ws.send(JSON.stringify({type: "task", success: false, error: "You have not completed the previous level yet"}));
			ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student, courseTasks, packet.section)}));
			return;
		}
	}
	if(!courseTasks[packet.section].tasks[packet.level]) {
		ws.send(JSON.stringify({type: "task", success: false, error: "Level not found"}));
		ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student, courseTasks, packet.section)}));
		return;
	}
	// Max level check
	if(course.maxSection != -1) {
		if(packet.section >= course.maxSection && packet.level > course.maxLevel) {
			ws.send(JSON.stringify({type: "task", success: false, error: "Max level reached"}));
			return;
		}
	}
	ws.send(JSON.stringify({ type: "task", success: true, task: courseTasks[packet.section].tasks[packet.level] }));
}