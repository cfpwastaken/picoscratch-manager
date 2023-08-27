import { DataTypes } from "sequelize";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import Course from "./course.js";

@Table({
	modelName: "codegroup"
})
export default class CodeGroup extends Model {

	@AllowNull(false)
	@Column(DataTypes.STRING)
	declare code: string;

	@AllowNull(false)
	@PrimaryKey
	@Column({
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4
	})
	declare uuid: string;

  @ForeignKey(() => Course)
	declare courseUuid: string;

	@BelongsTo(() => Course)
  declare course: Course;

}