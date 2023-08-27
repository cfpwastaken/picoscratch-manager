import z from "zod";
import { Connection, sendVerifications } from "../../connection";
import { WebSocket } from "ws";

export const InGetVerificationsPacket = z.object({
	type: z.literal("getVerifications"),
	course: z.string()
});

export type InGetVerificationsPacket = z.infer<typeof InGetVerificationsPacket>;

export async function handleGetVerificationsPacket(packet: InGetVerificationsPacket, con: Connection, ws: WebSocket) {
	sendVerifications(packet.course, ws);
}