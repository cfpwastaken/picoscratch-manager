import z from "zod";
import { Connection } from "../connection";
import { lastPing } from "../main";
import { WebSocket } from "ws";

export const InPongPacket = z.object({
	type: z.literal("pong")
});

export type InPongPacket = z.infer<typeof InPongPacket>;

export function handlePongPacket(packet: InPongPacket, con: Connection, ws: WebSocket) {
	const ping = Date.now() - lastPing;
	ws.send(JSON.stringify({
		type: "pingTime",
		ping
	}));
}