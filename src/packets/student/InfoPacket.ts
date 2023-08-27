import z from "zod";
import { Connection } from "../../connection.js";
import { WebSocket } from "ws";
import { tasks } from "../../main.js";

export const InInfoPacket = z.object({
	type: z.literal("info"),
	level: z.number()
});

export type InInfoPacket = z.infer<typeof InInfoPacket>;

export async function handleInfoPacket(packet: InInfoPacket, con: Connection, ws: WebSocket) {
	ws.send(JSON.stringify({ type: "info", name: tasks[packet.level].name, desc: tasks[packet.level].desc }));
}