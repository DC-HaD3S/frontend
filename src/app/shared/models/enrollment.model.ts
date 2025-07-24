export interface Enrollment {
  username: string;
  courseId: number;
  courseName: string;
  body?: string; 
  imageUrl?: string;
  price?: number;
instructorId?: number | null;
  instructor?: string;
}
