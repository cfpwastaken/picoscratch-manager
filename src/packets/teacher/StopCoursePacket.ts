import z from "zod";
import { Connection, broadcastStudentsInCourse, broadcastTeachers } from "../../connection.js";
import Course from "../../model/course.js";
import { WebSocket } from "ws";

export const InStopCoursePacket = z.object({
	type: z.literal("stopCourse"),
	uuid: z.string()
});

export type InStopCoursePacket = z.infer<typeof InStopCoursePacket>;

export async function handleStopCoursePacket(packet: InStopCoursePacket, con: Connection, ws: WebSocket) {
	const course = await Course.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!course) {
		ws.send(JSON.stringify({
			type: "stopCourse",
			success: false,
			error: "Course not found."
		}));
		return;
	}
	course.isRunning = false;
	await course.save();
	await broadcastStudentsInCourse(course, {
		type: "stopCourse",
	});
	broadcastTeachers(con.school, {
		type: "stopCourse",
		course
	});
}