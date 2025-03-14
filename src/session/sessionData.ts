export interface SessionData {
  userId: string;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  userAvatar: string;
  expires: number;
}

export const defaultSession: SessionData = {
  userId: '',
  userName: '',
  userEmail: '',
  userAvatar: 'default',
  isLoggedIn: false,
  expires: 0,
};
