export interface InstructorDetails {
  name: string;
  email: string;
  qualifications: string;
  experience: number;
  courses: string;
  photoUrl: string;
  aboutMe: string;
  twitterUrl?: string;
  githubUrl?: string;
}

export interface CourseDTO {
  id: number;
  title: string;
  body: string;
  imageUrl: string;
  price: number;
  instructorId: number;
  instructor: string;
}
