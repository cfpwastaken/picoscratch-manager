import { z } from "zod";
import Teacher from "../../../model/teacher";
export const InChangeTeacherPasswordPacket = z.object({
    type: z.literal("changeTeacherPassword"),
    uuid: z.string(),
    password: z.string()
});
export async function handleChangeTeacherPasswordPacket(packet, con, ws) {
    const teacher = await Teacher.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!teacher) {
        ws.send(JSON.stringify({
            type: "changeTeacherPassword",
            success: false,
            error: "Teacher not found"
        }));
        return;
    }
    teacher.password = packet.password;
    await teacher.save();
    ws.send(JSON.stringify({
        type: "changeTeacherPassword",
        success: true,
        uuid: packet.uuid
    }));
}
