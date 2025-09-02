import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";
import Admin, { IAdmin } from "../models/admin.model";

export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string) {
    return await Admin.findOne({ email }).exec();
  }

  async findById(id: string) {
    return await Admin.findById(id).exec();
  }

  async updateById(id: string, update: Partial<IAdmin>) {
    return await Admin.findByIdAndUpdate(id, update, {
      new: true,
    }).exec();
  }

  async incrementTokenVersion(id: string): Promise<void> {
    console.log("ithinte id", id);
    await Admin.findByIdAndUpdate(id, { $inc: { tokenVersion: 15 } }).exec();
  }
}
