import z from "zod";
import Room from "../../model/room";
export const InRoomPacket = z.object({
    type: z.literal("room"),
    uuid: z.string()
});
export async function handleRoomPacket(packet, con, ws) {
    const room = await Room.findOne({
        where: {
            uuid: packet.uuid,
            schoolUuid: con.school.uuid
        }
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "room",
            success: false,
            error: "Room not found."
        }));
        return;
    }
    con.room = room;
    ws.send(JSON.stringify({
        type: "room",
        success: true
    }));
}
