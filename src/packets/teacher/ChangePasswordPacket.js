import z from "zod";
export const InChangePasswordPacket = z.object({
    type: z.literal("changePassword"),
    password: z.string()
});
export async function handleChangePasswordPacket(packet, con, ws) {
    if (con.isAdmin) {
        con.school.adminPassword = packet.password;
        await con.school.save();
    }
    else {
        con.thisTeacher.password = packet.password;
        await con.thisTeacher.save();
    }
}
