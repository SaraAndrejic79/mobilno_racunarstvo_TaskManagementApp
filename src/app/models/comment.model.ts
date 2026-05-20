export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  savedBy?: { [userId: string]: boolean }; 
}