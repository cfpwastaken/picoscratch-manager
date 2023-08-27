import z from "zod";
import { awaitingVerification, broadcastVerifications } from "../../connection";
import { loggedIn } from "../../main";
export const InDismissPacket = z.object({
    type: z.literal("dismiss"),
    uuid: z.string(),
    course: z.string()
});
export async function handleDismissPacket(packet, con, ws) {
    const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
    if (!verification)
        return;
    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
    if (logged) {
        logged.ws.send(JSON.stringify({ type: "dismiss" }));
    }
    awaitingVerification[packet.course] = awaitingVerification[packet.course].filter(v => v.uuid != packet.uuid);
    broadcastVerifications(con.school, packet.course);
}
