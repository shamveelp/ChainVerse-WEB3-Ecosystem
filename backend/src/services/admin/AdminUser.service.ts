import { injectable, inject } from 'inversify';
import { IAdminUserService } from '../../core/interfaces/services/admin/IAdminUser.service';
import { IUserRepository } from '../../core/interfaces/repositories/IUser.repository';
import { IUser } from '../../models/user.models';
import { TYPES } from '../../core/types/types';
import { CustomError } from '../../utils/customError';
import { StatusCode } from '../../enums/statusCode.enum';
import { ErrorMessages } from '../../enums/messages.enum';

@injectable()
export class AdminUserService implements IAdminUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
  ) { }

  /**
   * Retrieves all users with pagination.
   * @param {number} page - Page number.
   * @param {number} limit - Items per page.
   * @param {string} search - Search query.
   * @returns {Promise<any>} Paginated users.
   */
  async getAllUsers(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    const users = await this._userRepository.findAllWithPagination(skip, limit, search);
    const total = await this._userRepository.count(search);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves a user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<IUser | null>} User object.
   */
  async getUserById(id: string): Promise<IUser | null> {
    return await this._userRepository.findById(id);
  }

  /**
   * Updates user status.
   * @param {string} id - User ID.
   * @param {Partial<IUser>} updateData - Data to update.
   * @returns {Promise<IUser | null>} Updated user.
   * @throws {CustomError} If user not found.
   */
  async updateUserStatus(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const user = await this._userRepository.findById(id);
    if (!user) {
      throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    return await this._userRepository.update(id, updateData);
  }

  /**
   * Deletes a user.
   * @param {string} id - User ID.
   * @returns {Promise<boolean>} True if successful.
   * @throws {CustomError} If user not found.
   */
  async deleteUser(id: string): Promise<boolean> {
    const user = await this._userRepository.findById(id);
    if (!user) {
      throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    const deleted = await this._userRepository.delete(id);
    return !!deleted;
  }
}