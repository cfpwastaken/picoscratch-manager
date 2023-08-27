import z from "zod";
import { Connection, broadcastTeachers } from "../../connection";
import Course from "../../model/course";
import Room from "../../model/room";
import { WebSocket } from "ws";

export const InSetActiveCoursePacket = z.object({
	type: z.literal("setActiveCourse"),
	uuid: z.string(),
	course: z.string() // uuid
});

export type InSetActiveCoursePacket = z.infer<typeof InSetActiveCoursePacket>;

export async function handleSetActiveCoursePacket(packet: InSetActiveCoursePacket, con: Connection, ws: WebSocket) {
	const room = await Room.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!room) {
		ws.send(JSON.stringify({
			type: "setActiveCourse",
			success: false,
			error: "Room not found."
		}));
		return;
	}

	let course = null;
	if(!(packet.course == "nocourse")) {
		course = await Course.findOne({
			where: {
				uuid: packet.course,
				schoolUuid: con.school.uuid
			}
		});
		if(!course) {
			ws.send(JSON.stringify({
				type: "setActiveCourse",
				success: false,
				error: "Course not found."
			}));
			return;
		}
	}
	await room.$set("course", course);
	broadcastTeachers(con.school, {
		type: "setActiveCourse",
		uuid: packet.uuid,
		course: packet.course
	});
}