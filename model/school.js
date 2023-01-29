import { DataTypes, Op } from "sequelize";
import { hashSync } from "bcrypt";
import { Teacher } from "./teacher.js";
import { Course } from "./course.js";

export let School = (sql) => {
	School = sql.define("school", {
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
		// teachers: {
		// 	type: DataTypes.STRING,
		// 	allowNull: false,
		// 	defaultValue: "",
		// 	get() {
		// 		const uuids = this.getDataValue("teachers").split(",")
		// 		return Teacher.findAll({
		// 			where: {
		// 				uuid: {
		// 					[Op.in]: uuids
		// 				}
		// 			}
		// 		})
		// 	},
		// 	set(value) {
		// 		this.setDataValue("teachers", value.map(teacher => teacher.uuid).join(","))
		// 	}
		// },
		adminPassword: {
			type: DataTypes.STRING,
			allowNull: false,
			set(value) {
				this.setDataValue("adminPassword", hashSync(value, 10))
			}
		},
		// courses: {
		// 	type: DataTypes.STRING,
		// 	allowNull: false,
		// 	defaultValue: "",
		// 	get() {
		// 		const uuids = this.getDataValue("courses").split(",")
		// 		return Course.findAll({
		// 			where: {
		// 				uuid: {
		// 					[Op.in]: uuids
		// 				}
		// 			}
		// 		})
		// 	},
		// 	set(value) {
		// 		this.setDataValue("courses", value.map(course => course.uuid).join(","))
		// 	}
		// },
		code: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ""
		},
		lang: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "en"
		},
		channel: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "latest"
		}
	}, {
		paranoid: true
	})
}
