import z from "zod";
import { Connection, awaitingVerification } from "../../connection.js";
import { WebSocket } from "ws";
import { loggedIn } from "../../main.js";

export const InVerifyPacket = z.object({
	type: z.literal("verify"),
	uuid: z.string(),
	course: z.string()
});

export type InVerifyPacket = z.infer<typeof InVerifyPacket>;

export async function handleVerifyPacket(packet: InVerifyPacket, con: Connection, ws: WebSocket) {
	const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
	if(!verification) return;
	const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
	verification.verified = true;
	if(logged) {
		logged.ws.emit("message", JSON.stringify(verification.packet));
	}
}