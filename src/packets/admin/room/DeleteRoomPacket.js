import z from "zod";
import { broadcastAdmins } from "../../../connection";
import Room from "../../../model/room";
export const InDeleteRoomPacket = z.object({
    type: z.literal("deleteRoom"),
    uuid: z.string()
});
export async function handleDeleteRoomPacket(packet, con, ws) {
    const room = await Room.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "deleteCourse",
            success: false,
            error: "Course not found."
        }));
        return;
    }
    await room.destroy();
    ws.send(JSON.stringify({
        type: "deleteRoom",
        success: true,
        uuid: packet.uuid
    }));
    broadcastAdmins(con.school, {
        type: "deleteRoom",
        wasUUID: packet.uuid
    }, con.cid);
}
