import z from "zod";
import { Connection } from "../../connection";
import Course from "../../model/course";
import { courseLeaderboardJSON } from "../../utils";
import { WebSocket } from "ws";

export const InGetCourseInfoPacket = z.object({
	type: z.literal("getCourseInfo"),
	uuid: z.string()
});

export type InGetCourseInfoPacket = z.infer<typeof InGetCourseInfoPacket>;

export async function handleGetCourseInfoPacket(packet: InGetCourseInfoPacket, con: Connection, ws: WebSocket) {
	const course = await Course.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!course) {
		ws.send(JSON.stringify({
			type: "getCourseInfo",
			success: false,
			error: "Course not found."
		}));
		return;
	}
	ws.send(JSON.stringify({
		type: "getCourseInfo",
		success: true,
		leaderboard: await courseLeaderboardJSON(course)
	}));
}