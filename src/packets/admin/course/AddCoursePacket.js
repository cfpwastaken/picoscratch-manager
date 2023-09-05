import z from "zod";
import { broadcastAdmins } from "../../../connection.js";
export const InAddCoursePacket = z.object({
    type: z.literal("addCourse"),
    name: z.string(),
    courseType: z.enum(["coding", "chemistry"])
});
export async function handleAddCoursePacket(packet, con, ws) {
    if (con.school.isDemo) {
        if ((await con.school.$count("courses")) >= 10) {
            ws.send(JSON.stringify({
                type: "addCourse",
                success: false,
                error: "You have reached the maximum number of courses for this demo school."
            }));
            return;
        }
    }
    const course = await con.school.$create("course", {
        name: packet.name,
        courseType: packet.courseType
    });
    ws.send(JSON.stringify({
        type: "addCourse",
        success: true,
        course
    }));
    broadcastAdmins(con.school, {
        type: "addCourse",
        course
    }, con.cid);
}
