import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";
import Admin from "../models/admin.model";

export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string) {
    return await Admin.findOne({ email }).exec();
  }
}
