import z from "zod";
import { Connection, broadcastAdmins } from "../../../connection.js";
import Course from "../../../model/course.js";
import { WebSocket } from "ws";

export const InDeleteCoursePacket = z.object({
	type: z.literal("deleteCourse"),
	uuid: z.string()
});

export type InDeleteCoursePacket = z.infer<typeof InDeleteCoursePacket>;

export async function handleDeleteCoursePacket(packet: InDeleteCoursePacket, con: Connection, ws: WebSocket) {
	const course = await Course.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!course) {
		ws.send(JSON.stringify({
			type: "deleteCourse",
			success: false,
			error: "Course not found."
		}));
		return;
	}
	await course.destroy();
	ws.send(JSON.stringify({
		type: "deleteCourse",
		success: true,
		uuid: packet.uuid
	}));
	broadcastAdmins(con.school, {
		type: "deleteCourse",
		wasUUID: packet.uuid
	}, con.cid);
}