import z from "zod";
import { resendLeaderboard } from "../../connection";
export const InIdleStateChangePacket = z.object({
    type: z.literal("idleStateChange"),
    idle: z.boolean()
});
export async function handleIdleStateChangePacket(packet, con, ws) {
    con.idle = packet.idle;
    const course = await con.room.$get("course");
    if (course == null)
        return;
    await resendLeaderboard(con.school, course);
}
