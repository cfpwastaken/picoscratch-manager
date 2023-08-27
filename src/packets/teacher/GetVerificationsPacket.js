import z from "zod";
import { sendVerifications } from "../../connection";
export const InGetVerificationsPacket = z.object({
    type: z.literal("getVerifications"),
    course: z.string()
});
export async function handleGetVerificationsPacket(packet, con, ws) {
    sendVerifications(packet.course, ws);
}
