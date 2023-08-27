import { DataTypes } from "sequelize";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import Course from "./course.js";
import School from "./school.js";

@Table({
	paranoid: true,
	modelName: "room"
})
export default class Room extends Model {
	
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

  @ForeignKey(() => School)
	declare schoolUuid: string;
	
	@BelongsTo(() => School)
  declare school: School;

  @ForeignKey(() => Course)
	declare courseUuid: string;

	@BelongsTo(() => Course)
  declare course: Course;

}
