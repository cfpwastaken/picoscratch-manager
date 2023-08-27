import z from "zod";
import { Connection, broadcastTeachers, resendLeaderboard } from "../../connection";
import Course from "../../model/course";
import Room from "../../model/room";
import { WebSocket } from "ws";
import Student from "../../model/student";
import sequelize from "sequelize";
import { capitalizeWords, courseLeaderboardJSON, studentSections } from "../../utils";
import { demoTasks, tasks } from "../../main";

export const InIdleStateChangePacket = z.object({
	type: z.literal("idleStateChange"),
	idle: z.boolean()
})

export type InIdleStateChangePacket = z.infer<typeof InIdleStateChangePacket>;

export async function handleIdleStateChangePacket(packet: InIdleStateChangePacket, con: Connection, ws: WebSocket) {
	con.idle = packet.idle;
	const course = await con.room.$get("course");
	if(course == null) return;
	await resendLeaderboard(con.school, course);
}