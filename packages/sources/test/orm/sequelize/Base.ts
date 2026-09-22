import { Column, CreatedAt, DataType, Default, IsUUID, PrimaryKey, UpdatedAt } from "sequelize-typescript";
import { Model as SequelizeModel } from "sequelize-typescript";

class Model<
  TAttributes extends object = any,
  TCreation extends object = TAttributes,
> extends SequelizeModel<TAttributes, TCreation> {}

class IdModel<
  TAttributes extends object = any,
  TCreation extends object = TAttributes,
> extends Model<TAttributes, TCreation> {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default IdModel;
