import z from "zod";
import { Connection, resendLeaderboard } from "../../connection";
import { WebSocket } from "ws";

export const InIdleStateChangePacket = z.object({
	type: z.literal("idleStateChange"),
	idle: z.boolean()
});

export type InIdleStateChangePacket = z.infer<typeof InIdleStateChangePacket>;

export async function handleIdleStateChangePacket(packet: InIdleStateChangePacket, con: Connection, ws: WebSocket) {
	con.idle = packet.idle;
	const course = await con.room.$get("course");
	if(course == null) return;
	await resendLeaderboard(con.school, course);
}