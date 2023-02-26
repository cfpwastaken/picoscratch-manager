var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import { z } from "zod";
import Course from "./course.js";
let Student = class Student extends Model {
};
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], Student.prototype, "name", void 0);
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column({
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    })
], Student.prototype, "uuid", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.INTEGER,
        defaultValue: 1
    })
], Student.prototype, "level", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.INTEGER,
        defaultValue: 0
    })
], Student.prototype, "answeredqs", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.INTEGER,
        defaultValue: 0
    })
], Student.prototype, "correctqs", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        defaultValue: "",
        get() {
            return this.getDataValue("achievements").split(",");
        },
        set(value) {
            const achievements = z.array(z.string()).safeParse(value);
            if (!achievements.success)
                throw new Error("Invalid achievement data");
            this.setDataValue("achievements", achievements.data.join(","));
        }
    })
], Student.prototype, "achievements", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        defaultValue: JSON.stringify({ lastday: 0, completedLevels: 0 }),
        get() {
            return JSON.parse(this.getDataValue("achievementdata"));
        },
        set(value) {
            this.setDataValue("achievementdata", JSON.stringify(value));
        }
    })
], Student.prototype, "achievementdata", void 0);
__decorate([
    ForeignKey(() => Course)
], Student.prototype, "courseUuid", void 0);
__decorate([
    BelongsTo(() => Course)
], Student.prototype, "course", void 0);
Student = __decorate([
    Table({
        paranoid: true,
        modelName: "student"
    })
], Student);
export default Student;
