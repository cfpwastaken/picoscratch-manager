import z from "zod";
import { Connection, resendLeaderboard } from "../../connection";
import Student from "../../model/student";
import { loggedIn } from "../../main";
import { WebSocket } from "ws";

export const InDeletePacket = z.object({
	type: z.literal("delete"),
	uuid: z.string(),
	courseUUID: z.string()
});

export type InDeletePacket = z.infer<typeof InDeletePacket>;

export async function handleDeletePacket(packet: InDeletePacket, con: Connection, ws: WebSocket) {
	const student = await Student.findOne({ where: { uuid: packet.uuid } });
	if(!student) {
		ws.send(JSON.stringify({
			type: "delete",
			success: false,
			error: "Student not found."
		}));
		return;
	}
	const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
	if(logged) {
		logged.ws.send(JSON.stringify({type: "kick"}));
		logged.ws.close();
	}
	await student.destroy();
	
	const course = await student.$get("course");
	if(course)
		await resendLeaderboard(con.school, course);
}