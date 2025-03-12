export interface SessionData {
  userId: string;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  avatar?: string | null;
  expires: number;
}

export const defaultSession: SessionData = {
  userId: '',
  userName: '',
  userEmail: '',
  isLoggedIn: false,
  expires: 0,
};
