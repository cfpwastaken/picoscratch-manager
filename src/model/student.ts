import { DataTypes } from "sequelize";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import { z } from "zod";
import Course from "./course.js";

@Table({
	paranoid: true,
	modelName: "student"
})
export default class Student extends Model {
	
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
		type: DataTypes.INTEGER,
		defaultValue: 1
	})
	declare level: number;

	@AllowNull(false)
	@Column({
		type: DataTypes.INTEGER,
		defaultValue: 0
	})
	declare answeredqs: number;

	@AllowNull(false)
	@Column({
		type: DataTypes.INTEGER,
		defaultValue: 0
	})
	declare correctqs: number;

	@AllowNull(false)
	@Column({
		type: DataTypes.STRING,
		defaultValue: "",
		get() {
			return this.getDataValue("achievements").split(",");
		},
		set(value) {
			const achievements = z.array(z.string()).safeParse(value);
			if(!achievements.success) throw new Error("Invalid achievement data");
			this.setDataValue("achievements", achievements.data.join(","));
		}
	})
	declare achievements: string[];

	@AllowNull(false)
	@Column({
		type: DataTypes.STRING,
		defaultValue: JSON.stringify({lastday: 0, completedLevels: 0}),
		get() {
			return JSON.parse(this.getDataValue("achievementdata"));
		},
		set(value) {
			this.setDataValue("achievementdata", JSON.stringify(value));
		}
	})
	declare achievementdata: {lastday: number, completedLevels: number};

  @ForeignKey(() => Course)
	declare courseId: string;

	@BelongsTo(() => Course)
	declare course: Course;

}