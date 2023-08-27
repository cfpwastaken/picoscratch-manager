import z from "zod";
import { Connection, broadcastStudentsInCourse, broadcastTeachers, sendVerifications } from "../../connection";
import Course from "../../model/course";
import { courseLeaderboardJSON } from "../../utils";
import { WebSocket } from "ws";

export const InGetVerificationsPacket = z.object({
	type: z.literal("getVerifications"),
	course: z.string()
})

export type InGetVerificationsPacket = z.infer<typeof InGetVerificationsPacket>;

export async function handleGetVerificationsPacket(packet: InGetVerificationsPacket, con: Connection, ws: WebSocket) {
	sendVerifications(packet.course, ws);
}