import z from "zod";
import { Connection, broadcastAdmins } from "../../../connection";
import { WebSocket } from "ws";

export const InAddCoursePacket = z.object({
	type: z.literal("addCourse"),
	name: z.string()
});

export type InAddCoursePacket = z.infer<typeof InAddCoursePacket>;

export async function handleAddCoursePacket(packet: InAddCoursePacket, con: Connection, ws: WebSocket) {
	if(con.school.isDemo) {
		if((await con.school.$count("courses")) >= 10) {
			ws.send(JSON.stringify({
				type: "addCourse",
				success: false,
				error: "You have reached the maximum number of courses for this demo school."
			}));
			return;
		}
	}

	const course = await con.school.$create("course", {
		name: packet.name
	});
	ws.send(JSON.stringify({
		type: "addCourse",
		success: true,
		course
	}));
	broadcastAdmins(con.school, {
		type: "addCourse",
		course
	}, con.cid);
}