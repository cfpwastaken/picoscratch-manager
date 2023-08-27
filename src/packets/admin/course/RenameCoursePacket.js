import z from "zod";
import { broadcastTeachers } from "../../../connection.js";
import Course from "../../../model/course.js";
export const InRenameCoursePacket = z.object({
    type: z.literal("renameCourse"),
    uuid: z.string(),
    name: z.string()
});
export async function handleRenameCoursePacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "renameCourse",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    course.name = packet.name;
    await course.save();
    broadcastTeachers(con.school, {
        type: "renameCourse",
        uuid: packet.uuid,
        name: packet.name
    });
}
