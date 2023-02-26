import { DataTypes } from "sequelize";
import { hashSync } from "bcrypt";
import { Column, AllowNull, PrimaryKey, Table, Model, HasMany } from "sequelize-typescript";
import Teacher from "./teacher.js";
import Course from "./course.js";
import Room from "./room.js";

@Table({
	paranoid: true,
	modelName: "school"
})
export default class School extends Model {
	
	@AllowNull(false)
	@Column(DataTypes.STRING)
	declare name: string;

	@AllowNull(false)
	@PrimaryKey
	@Column({
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4
	})
	declare uuid: string;

	@AllowNull(false)
	@Column({
		type: DataTypes.STRING,
		set(value) {
			this.setDataValue("adminPassword", hashSync(String(value), 10))
		}
	})
	declare adminPassword: string;

	@AllowNull(false)
	@Column(DataTypes.STRING)
	declare code: string;

	@AllowNull(false)
	@Column({
		type: DataTypes.STRING,
		defaultValue: "en"
	})
	declare lang: string;

	@AllowNull(false)
	@Column({
		type: DataTypes.STRING,
		defaultValue: "latest"
	})
	declare channel: string;

	@HasMany(() => Teacher)
	declare teachers: Teacher[];

	@HasMany(() => Course)
	declare courses: Course[];

	@HasMany(() => Room)
	declare rooms: Room[];

}
