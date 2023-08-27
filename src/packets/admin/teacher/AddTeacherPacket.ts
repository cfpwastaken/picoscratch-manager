import { z } from "zod";
import { Connection, broadcastAdmins } from "../../../connection";
import { WebSocket } from "ws";

export const InAddTeacherPacket = z.object({
	type: z.literal("addTeacher"),
	username: z.string(),
	password: z.string(),
});

export type InAddTeacherPacket = z.infer<typeof InAddTeacherPacket>;

export async function handleAddTeacherPacket(packet: InAddTeacherPacket, con: Connection, ws: WebSocket) {
	if(con.school.isDemo) {
		if((await con.school.$count("teachers")) >= 10) {
			ws.send(JSON.stringify({
				type: "addTeacher",
				success: false,
				error: "You have reached the maximum number of teachers for this demo school."
			}));
			return;
		}
	}
	const teacher = await con.school.$create("teacher", {
		name: packet.username,
		password: packet.password
	});
	ws.send(JSON.stringify({
		type: "addTeacher",
		success: true,
		teacher
	}));
	broadcastAdmins(con.school, { type: "addTeacher", teacher }, con.cid)
}