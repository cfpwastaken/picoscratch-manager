import z from "zod";
import { Connection, broadcastTeachers, resendLeaderboard } from "../../connection";
import Course from "../../model/course";
import Room from "../../model/room";
import { WebSocket } from "ws";
import Student from "../../model/student";
import sequelize from "sequelize";
import { capitalizeWords, courseLeaderboardJSON, studentSections } from "../../utils";
import { demoTasks, tasks } from "../../main";

export const InInfoPacket = z.object({
	type: z.literal("info"),
	level: z.number()
});

export type InInfoPacket = z.infer<typeof InInfoPacket>;

export async function handleInfoPacket(packet: InInfoPacket, con: Connection, ws: WebSocket) {
	ws.send(JSON.stringify({ type: "info", name: tasks[packet.level].name, desc: tasks[packet.level].desc }));
}