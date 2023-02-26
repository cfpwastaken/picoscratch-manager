import { DataTypes } from "sequelize";
import { hashSync } from "bcrypt";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import School from "./school.js";

@Table({
	paranoid: true,
	modelName: "teacher"
})
export default class Teacher extends Model {
	
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
			this.setDataValue("password", hashSync(String(value), 10))
		}
	})
	declare password: string;

  @ForeignKey(() => School)
  declare schoolUuid: string;

	@BelongsTo(() => School)
	declare school: School;

}