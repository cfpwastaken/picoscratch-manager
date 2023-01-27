import { DataTypes } from "sequelize";

export let Support = (sql) => {
	Support = sql.define("support", {
		id: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		data: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		paranoid: true
	})
}