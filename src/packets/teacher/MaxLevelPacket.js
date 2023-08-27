import z from "zod";
import { broadcastTeachers } from "../../connection.js";
import Course from "../../model/course.js";
export const InMaxLevelPacket = z.object({
    type: z.literal("maxLevel"),
    course: z.string(),
    maxSection: z.number(),
    maxLevel: z.number(),
});
export async function handleMaxLevelPacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.course,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "maxLevel",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    course.maxSection = packet.maxSection;
    course.maxLevel = packet.maxLevel;
    await course.save();
    broadcastTeachers(con.school, {
        type: "maxLevel",
        course: course.uuid,
        maxSection: packet.maxSection,
        maxLevel: packet.maxLevel
    });
}
