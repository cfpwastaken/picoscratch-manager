import z from "zod";
import { Connection } from "../../connection.js";
import Room from "../../model/room.js";
import { WebSocket } from "ws";

export const InRoomPacket = z.object({
	type: z.literal("room"),
	uuid: z.string()
});

export type InRoomPacket = z.infer<typeof InRoomPacket>;

export async function handleRoomPacket(packet: InRoomPacket, con: Connection, ws: WebSocket) {
	const room = await Room.findOne({
		where: {
			uuid: packet.uuid,
			schoolUuid: con.school.uuid
		}
	});
	if(!room) {
		ws.send(JSON.stringify({
			type: "room",
			success: false,
			error: "Room not found."
		}));
		return;
	}
	con.room = room;
	ws.send(JSON.stringify({
		type: "room",
		success: true
	}));
}