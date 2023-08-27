import { z } from "zod";
import { broadcastAdmins } from "../../../connection";
export const InAddTeacherPacket = z.object({
    type: z.literal("addTeacher"),
    username: z.string(),
    password: z.string(),
});
export async function handleAddTeacherPacket(packet, con, ws) {
    if (con.school.isDemo) {
        if ((await con.school.$count("teachers")) >= 10) {
            ws.send(JSON.stringify({
                type: "addTeacher",
                success: false,
                error: "You have reached the maximum number of teachers for this demo school."
            }));
            return;
        }
    }
    const teacher = await con.school.$create("teacher", {
        name: packet.username,
        password: packet.password
    });
    ws.send(JSON.stringify({
        type: "addTeacher",
        success: true,
        teacher
    }));
    broadcastAdmins(con.school, { type: "addTeacher", teacher }, con.cid);
}
