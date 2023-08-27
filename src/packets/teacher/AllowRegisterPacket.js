import z from "zod";
import { broadcastTeachers } from "../../connection.js";
import Course from "../../model/course.js";
export const InAllowRegisterPacket = z.object({
    type: z.literal("allowRegister"),
    course: z.string(),
    allow: z.boolean()
});
export async function handleAllowRegisterPacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.course,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "allowRegister",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    course.allowRegister = packet.allow;
    await course.save();
    broadcastTeachers(con.school, {
        type: "allowRegister",
        course: course.uuid,
        allow: packet.allow
    });
}
