import { Column, DataType, Table, Unique } from "sequelize-typescript";
import IdModel from "./Base";

@Table({ tableName: "users", modelName: "user" })
class User extends IdModel<
  InferAttributes<User>,
  Partial<InferCreationAttributes<User>>
> {
  @Unique
  @Column(DataType.STRING(254))
  email: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, field: "is_admin" })
  isAdmin: boolean;

  get label() {
    // A method body holds a colon, and is not a column.
    return { name: this.email };
  }
}

export default User;
