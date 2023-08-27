import z from "zod";
import { broadcastAdmins } from "../../../connection";
export const InAddRoomPacket = z.object({
    type: z.literal("addRoom"),
    name: z.string()
});
export async function handleAddRoomPacket(packet, con, ws) {
    if (con.school.isDemo) {
        if ((await con.school.$count("rooms")) >= 1) {
            ws.send(JSON.stringify({
                type: "addCourse",
                success: false,
                error: "You have reached the maximum number of rooms for this demo school."
            }));
            return;
        }
    }
    const room = await con.school.$create("course", {
        name: packet.name
    });
    ws.send(JSON.stringify({
        type: "addRoom",
        success: true,
        room
    }));
    broadcastAdmins(con.school, {
        type: "addRoom",
        room
    }, con.cid);
}
