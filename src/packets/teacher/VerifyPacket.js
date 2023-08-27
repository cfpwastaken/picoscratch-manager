import z from "zod";
import { awaitingVerification } from "../../connection.js";
import { loggedIn } from "../../main.js";
export const InVerifyPacket = z.object({
    type: z.literal("verify"),
    uuid: z.string(),
    course: z.string()
});
export async function handleVerifyPacket(packet, con, ws) {
    const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
    if (!verification)
        return;
    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
    verification.verified = true;
    if (logged) {
        logged.ws.emit("message", JSON.stringify(verification.packet));
    }
}
