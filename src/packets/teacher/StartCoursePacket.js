import z from "zod";
import { broadcastStudentsInCourse, broadcastTeachers } from "../../connection.js";
import Course from "../../model/course.js";
export const InStartCoursePacket = z.object({
    type: z.literal("startCourse"),
    uuid: z.string()
});
export async function handleStartCoursePacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "startCourse",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    course.isRunning = true;
    await course.save();
    await broadcastStudentsInCourse(course, {
        type: "startCourse",
    });
    broadcastTeachers(con.school, {
        type: "startCourse",
        course
    });
}
