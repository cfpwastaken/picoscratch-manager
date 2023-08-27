import z from "zod";
import { broadcastAdmins } from "../../../connection";
import Course from "../../../model/course";
export const InDeleteCoursePacket = z.object({
    type: z.literal("deleteCourse"),
    uuid: z.string()
});
export async function handleDeleteCoursePacket(packet, con, ws) {
    const course = await Course.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!course) {
        ws.send(JSON.stringify({
            type: "deleteCourse",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    await course.destroy();
    ws.send(JSON.stringify({
        type: "deleteCourse",
        success: true,
        uuid: packet.uuid
    }));
    broadcastAdmins(con.school, {
        type: "deleteCourse",
        wasUUID: packet.uuid
    }, con.cid);
}
