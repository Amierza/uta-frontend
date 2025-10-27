import { ref } from "vue";
import { getUserProfile } from "../api/user";
import type { UserResponse } from "../types/user";

export function useUser() {
  const userId = ref<string>("");
  const userType = ref<"mahasiswa" | "dosen">("mahasiswa");
  const userName = ref("");
  const userIdentifier = ref("");
  const userEmail = ref("");
  const userThesisId = ref("");
  const userLecturerId = ref("");
  const userPhoto = ref("");
  const userTotalStudent = ref(0);
  const userStudyProgram = ref("");
  const userFaculty = ref("");
  const isOnline = ref(true);
  const isLoadingProfile = ref(false);

  const fetchUserProfile = async () => {
    try {
      isLoadingProfile.value = true;
      const response = await getUserProfile();

      if (response.status) {
        const userData: UserResponse = response.data;

        userId.value = userData.id;
        userType.value = userData.role === "lecturer" ? "dosen" : "mahasiswa";

        if (userData.role === "lecturer" && userData.lecturer) {
          userLecturerId.value = userData.lecturer.id;
          userName.value = userData.lecturer.name;
          userIdentifier.value = userData.lecturer.nip;
          userEmail.value = userData.lecturer.email;
          userTotalStudent.value = userData.lecturer.total_student;
          userStudyProgram.value = userData.lecturer.study_program.name;
          userFaculty.value = userData.lecturer.study_program.faculty.name;
        } else if (userData.role === "student" && userData.student) {
          userName.value = userData.student.name;
          userIdentifier.value = userData.student.nim;
          userEmail.value = userData.student.email;
          userThesisId.value = userData.thesis_id;
          userStudyProgram.value = userData.student.study_program.name;
          userFaculty.value = userData.student.study_program.faculty.name;
        }

        localStorage.setItem("user_type", userType.value);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const storedUserType = localStorage.getItem("user_type");
      if (storedUserType) {
        userType.value = storedUserType as "mahasiswa" | "dosen";
      }
    } finally {
      isLoadingProfile.value = false;
    }
  };

  return {
    // State
    userId,
    userType,
    userName,
    userLecturerId,
    userIdentifier,
    userEmail,
    userThesisId,
    userPhoto,
    userTotalStudent,
    userStudyProgram,
    userFaculty,
    isOnline,
    isLoadingProfile,
    // Methods
    fetchUserProfile,
  };
}
