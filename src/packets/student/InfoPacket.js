import z from "zod";
import { getTasksForCourse } from "../../utils.js";
export const InInfoPacket = z.object({
    type: z.literal("info"),
    level: z.number()
});
export async function handleInfoPacket(packet, con, ws) {
    const course = await con.room.$get("course");
    if (course == null)
        return;
    const courseTasks = await getTasksForCourse(course.uuid);
    ws.send(JSON.stringify({ type: "info", name: courseTasks[packet.level].name, desc: courseTasks[packet.level].desc }));
}
