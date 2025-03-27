import { UserRole } from 'src/modules/user/user.entity';

export interface ITokenUser {
  user: string;
  userId: number;
  role: UserRole;
  email: string;
}
export const createTokenUser = (user): ITokenUser => {
  return {
    user: user.name,
    userId: user.id,
    role: user.role,
    email: user.email,
  };
};
