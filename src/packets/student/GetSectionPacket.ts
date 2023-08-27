import z from "zod";
import { Connection, broadcastTeachers, resendLeaderboard } from "../../connection";
import Course from "../../model/course";
import Room from "../../model/room";
import { WebSocket } from "ws";
import Student from "../../model/student";
import sequelize from "sequelize";
import { capitalizeWords, courseLeaderboardJSON, studentLevelpath, studentSections } from "../../utils";
import { demoTasks, tasks } from "../../main";

export const InGetSectionPacket = z.object({
	type: z.literal("getSection"),
	section: z.number()
})

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