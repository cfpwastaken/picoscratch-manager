import { DataTypes } from "sequelize";
import { BelongsTo, Column, HasMany, HasOne, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import Room from "./room.js";
import School from "./school.js";
import Student from "./student.js";
import CodeGroup from "./codegroups.js";

@Table({
	paranoid: true,
	modelName: "course"
})
export default class Course extends Model {

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
		type: DataTypes.BOOLEAN,
		defaultValue: false
	})
	declare isRunning: boolean;

	@AllowNull(false)
	@Column({
		type: DataTypes.BOOLEAN,
		defaultValue: true
	})
	declare allowRegister: boolean;

  @ForeignKey(() => School)
  declare schoolUuid: string;

	@BelongsTo(() => School)
	declare school: School;

	@HasOne(() => Room)
	declare room: Room;

	@HasMany(() => Student)
	declare students: Student[];

	@HasMany(() => CodeGroup)
	declare codeGroups: CodeGroup[];

}