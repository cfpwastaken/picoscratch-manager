import z from "zod";
import { broadcastStudentsInCourse, broadcastTeachers } from "../../connection.js";
import Course from "../../model/course.js";
export const InStopCoursePacket = z.object({
    type: z.literal("stopCourse"),
    uuid: z.string()
});
export async function handleStopCoursePacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "stopCourse",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    course.isRunning = false;
    await course.save();
    await broadcastStudentsInCourse(course, {
        type: "stopCourse",
    });
    broadcastTeachers(con.school, {
        type: "stopCourse",
        course
    });
}
