import z from "zod";
import { Connection, broadcastTeachers } from "../../../connection";
import Course from "../../../model/course";
import { WebSocket } from "ws";

export const InRenameCoursePacket = z.object({
	type: z.literal("renameCourse"),
	uuid: z.string(),
	name: z.string()
});

export type InRenameCoursePacket = z.infer<typeof InRenameCoursePacket>;

export async function handleRenameCoursePacket(packet: InRenameCoursePacket, con: Connection, ws: WebSocket) {
	const course = await Course.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!course) {
		ws.send(JSON.stringify({
			type: "renameCourse",
			success: false,
			error: "Course not found."
		}));
		return;
	}

	course.name = packet.name;
	await course.save();
	broadcastTeachers(con.school, {
		type: "renameCourse",
		uuid: packet.uuid,
		name: packet.name
	});
}