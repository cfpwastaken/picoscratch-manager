import z from "zod";
import { resendLeaderboard } from "../../connection";
import Student from "../../model/student";
import { loggedIn } from "../../main";
export const InDeletePacket = z.object({
    type: z.literal("delete"),
    uuid: z.string(),
    courseUUID: z.string()
});
export async function handleDeletePacket(packet, con, ws) {
    const student = await Student.findOne({ where: { uuid: packet.uuid } });
    if (!student) {
        ws.send(JSON.stringify({
            type: "delete",
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
    await student.destroy();
    const course = await student.$get("course");
    if (course)
        await resendLeaderboard(con.school, course);
}
