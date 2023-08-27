import z from "zod";
import { Connection, broadcastStudentsInCourse, broadcastTeachers } from "../../connection";
import Course from "../../model/course";
import { WebSocket } from "ws";

export const InStartCoursePacket = z.object({
	type: z.literal("startCourse"),
	uuid: z.string()
});

export type InStartCoursePacket = z.infer<typeof InStartCoursePacket>;

export async function handleStartCoursePacket(packet: InStartCoursePacket, con: Connection, ws: WebSocket) {
	const course = await Course.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!course) {
		ws.send(JSON.stringify({
			type: "startCourse",
			success: false,
			error: "Course not found."
		}));
		return;
	}
	course.isRunning = true;
	await course.save();
	await broadcastStudentsInCourse(course, {
		type: "startCourse",
	});
	broadcastTeachers(con.school, {
		type: "startCourse",
		course
	});
}