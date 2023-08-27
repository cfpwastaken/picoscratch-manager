import z from "zod";
import { Connection } from "../../connection.js";
import Student from "../../model/student.js";
import { loggedIn } from "../../main.js";
import { WebSocket } from "ws";

export const InKickPacket = z.object({
	type: z.literal("kick"),
	uuid: z.string()
});

export type InKickPacket = z.infer<typeof InKickPacket>;

export async function handleKickPacket(packet: InKickPacket, con: Connection, ws: WebSocket) {
	const student = await Student.findOne({ where: { uuid: packet.uuid } });
	if(!student) {
		ws.send(JSON.stringify({
			type: "kick",
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
}