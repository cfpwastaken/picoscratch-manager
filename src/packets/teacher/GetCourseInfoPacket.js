import z from "zod";
import Course from "../../model/course.js";
import { courseLeaderboardJSON } from "../../utils.js";
export const InGetCourseInfoPacket = z.object({
    type: z.literal("getCourseInfo"),
    uuid: z.string()
});
export async function handleGetCourseInfoPacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "getCourseInfo",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    ws.send(JSON.stringify({
        type: "getCourseInfo",
        success: true,
        leaderboard: await courseLeaderboardJSON(course)
    }));
}
