import { DataTypes } from "sequelize";
import { Column, Model, AllowNull, PrimaryKey, Table } from "sequelize-typescript";

// export let Support = (sql) => {
// 	Support = sql.define("support", {
// 		id: {
// 			type: DataTypes.STRING,
// 			primaryKey: true
// 		},
// 		data: {
// 			type: DataTypes.TEXT,
// 			allowNull: false
// 		}
// 	}, {
// 		paranoid: true
// 	})
// }

@Table({
	paranoid: true,
	modelName: "support"
})
export default class Support extends Model {
	
	@AllowNull(false)
	@PrimaryKey
	@Column(DataTypes.STRING)
	declare code: string;
	
	@AllowNull(false)
	@Column(DataTypes.TEXT)
	declare data: string;
	
}