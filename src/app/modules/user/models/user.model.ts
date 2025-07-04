import { UserRole } from "src/app/enums/user-role.enum";

export interface User {
  id?: number; 
  name?: string; 
  email?: string; 
  username: string;
  role: UserRole;
  password?: string; 
}