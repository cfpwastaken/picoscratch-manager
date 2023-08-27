import { z } from "zod";
import { Connection } from "../../../connection.js";
import Teacher from "../../../model/teacher.js";
import { WebSocket } from "ws";

export const InChangeTeacherPasswordPacket = z.object({
	type: z.literal("changeTeacherPassword"),
	uuid: z.string(),
	password: z.string()
});

export type InChangeTeacherPasswordPacket = z.infer<typeof InChangeTeacherPasswordPacket>;

export async function handleChangeTeacherPasswordPacket(packet: InChangeTeacherPasswordPacket, con: Connection, ws: WebSocket) {
	const teacher = await Teacher.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!teacher) {
		ws.send(JSON.stringify({
			type: "changeTeacherPassword",
			success: false,
			error: "Teacher not found"
		}));
		return;
	}
	teacher.password = packet.password;
	await teacher.save();
	ws.send(JSON.stringify({
		type: "changeTeacherPassword",
		success: true,
		uuid: packet.uuid
	}));
}