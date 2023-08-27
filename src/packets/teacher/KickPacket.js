import z from "zod";
import Student from "../../model/student";
import { loggedIn } from "../../main";
export const InKickPacket = z.object({
    type: z.literal("kick"),
    uuid: z.string()
});
export async function handleKickPacket(packet, con, ws) {
    const student = await Student.findOne({ where: { uuid: packet.uuid } });
    if (!student) {
        ws.send(JSON.stringify({
            type: "kick",
            success: false,
            error: "Student not found."
        }));
        return;
    }
    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
    if (logged) {
        logged.ws.send(JSON.stringify({ type: "kick" }));
        logged.ws.close();
    }
}
