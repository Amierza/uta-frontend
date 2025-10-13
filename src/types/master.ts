import type { CustomUserResponse } from "./user";

export interface FacultyResponse {
  id: string;
  name: string;
}

export interface StudyProgramResponse {
  id: string;
  name: string;
  degree: string;
  faculty: FacultyResponse;
}

export interface StudentResponse {
  id: string;
  nim: string;
  name: string;
  email: string;
  study_program: StudyProgramResponse;
}

export interface LecturerResponse {
  id: string;
  nip: string;
  name: string;
  email: string;
  total_student: number;
  study_program: StudyProgramResponse;
}

export interface ThesisResponse {
  id: string;
  title: string;
  description: string;
  progress: string;
  student: CustomUserResponse;
  supervisors: CustomUserResponse[];
}
