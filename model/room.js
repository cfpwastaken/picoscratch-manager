import { DataTypes, Op } from "sequelize";

export let Room = (sql) => {
	Room = sql.define("room", {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		uuid: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4
		}
	}, {
		paranoid: true
	})
}
