import z from "zod";
import { Connection } from "../../connection.js";
import { WebSocket } from "ws";
import { capitalizeWords, studentLevelpath, studentSections } from "../../utils.js";
import { demoTasks, tasks } from "../../main.js";

export const InGetSectionPacket = z.object({
	type: z.literal("getSection"),
	section: z.number()
});

export type InGetSectionPacket = z.infer<typeof InGetSectionPacket>;

export async function handleGetSectionPacket(packet: InGetSectionPacket, con: Connection, ws: WebSocket) {
	const course = await con.room.$get("course");
	if(course == null) return;
	const s = await course.$get("students");
	const student = s.find(s => s.name == capitalizeWords(con.name.split(" ")).join(" ")) || null;
	if(!student) return;
	if(!(packet.section <= student.section)) {
		ws.send(JSON.stringify({type: "getSection", success: false, error: "You have not completed the previous section yet"}));
		ws.send(JSON.stringify({type: "sections", ...studentSections(student, con.school.isDemo ? demoTasks : tasks)}));
		return;
	}
	ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student, con.school.isDemo ? demoTasks : tasks, packet.section)}));
}