import z from "zod";
import { Connection } from "../../connection";
import { WebSocket } from "ws";

export const InChangePasswordPacket = z.object({
	type: z.literal("changePassword"),
	password: z.string()
});

export type InChangePasswordPacket = z.infer<typeof InChangePasswordPacket>;

export async function handleChangePasswordPacket(packet: InChangePasswordPacket, con: Connection, ws: WebSocket) {
	if(con.isAdmin) {
		con.school.adminPassword = packet.password;
		await con.school.save();
	} else {
		con.thisTeacher.password = packet.password;
		await con.thisTeacher.save();
	}
}