import { z } from "zod";
import { broadcastAdmins } from "../../../connection";
import Teacher from "../../../model/teacher";
export const InDeleteTeacherPacket = z.object({
    type: z.literal("deleteTeacher"),
    uuid: z.string()
});
export async function handleDeleteTeacherPacket(packet, con, ws) {
    const teacher = await Teacher.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!teacher) {
        ws.send(JSON.stringify({
            type: "deleteTeacher",
            success: false,
            error: "Teacher not found"
        }));
        return;
    }
    await teacher.destroy();
    ws.send(JSON.stringify({
        type: "deleteTeacher",
        success: true,
        wasUUID: packet.uuid
    }));
    broadcastAdmins(con.school, { type: "deleteTeacher", wasUUID: packet.uuid }, con.cid);
}
