import z from "zod";
import { Connection, broadcastAdmins } from "../../../connection.js";
import Room from "../../../model/room.js";
import { WebSocket } from "ws";

export const InDeleteRoomPacket = z.object({
	type: z.literal("deleteRoom"),
	uuid: z.string()
});

export type InDeleteRoomPacket = z.infer<typeof InDeleteRoomPacket>;

export async function handleDeleteRoomPacket(packet: InDeleteRoomPacket, con: Connection, ws: WebSocket) {
	const room = await Room.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!room) {
		ws.send(JSON.stringify({
			type: "deleteCourse",
			success: false,
			error: "Course not found."
		}));
		return;
	}
	await room.destroy();
	ws.send(JSON.stringify({
		type: "deleteRoom",
		success: true,
		uuid: packet.uuid
	}));
	broadcastAdmins(con.school, {
		type: "deleteRoom",
		wasUUID: packet.uuid
	}, con.cid);
}