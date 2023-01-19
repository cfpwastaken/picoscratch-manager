import { DataTypes, Op } from "sequelize";

export let Student = (sql) => {
	Student = sql.define("student", {
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
		level: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1
		},
		answeredqs: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		correctqs: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		// percentage: {
		// 	type: DataTypes.INTEGER,
		// 	allowNull: false,
		// 	defaultValue: 100
		// },
		// xp: {
		// 	type: DataTypes.INTEGER,
		// 	allowNull: false,
		// 	defaultValue: 0
		// },
		achievements: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "",
			get() {
				return this.getDataValue("achievements").split(",");
			},
			set(value) {
				this.setDataValue("achievements", value.join(","));
			}
		},
		achievementdata: {
			// JSON
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: JSON.stringify({lastday: 0, completedLevels: 0}),
			get() {
				return JSON.parse(this.getDataValue("achievementdata"));
			},
			set(value) {
				this.setDataValue("achievementdata", JSON.stringify(value));
			}
		}
	}, {
		paranoid: true
	})
}