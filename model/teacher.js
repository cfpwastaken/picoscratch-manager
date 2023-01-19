import { DataTypes } from "sequelize";
import { hashSync } from "bcrypt";

export let Teacher = (sql) => {
	Teacher = sql.define("teacher", {
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
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			set(value) {
				this.setDataValue("password", hashSync(value, 10))
			}
		}
	}, {
		paranoid: true
	})
}