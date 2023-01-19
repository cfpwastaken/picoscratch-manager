import { DataTypes } from "sequelize";

export let Course = (sql) => {
	Course = sql.define("course", {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		uuid: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4
		},
		isRunning: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}, {
		paranoid: true
	})
}