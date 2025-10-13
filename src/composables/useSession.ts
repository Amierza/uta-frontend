import { ref, type Ref } from "vue";
import {
  getAllSessions,
  startNewSession,
  getSessionDetail,
} from "../api/session";
import type { SessionResponse } from "../types/session";

export function useSessions(
  userId: Ref<string>,
  userType: Ref<"mahasiswa" | "dosen">,
  userIdentifier: Ref<string>
) {
  const sessions = ref<SessionResponse[]>([]);
  const sessionDetail = ref<SessionResponse | null>(null);
  const isLoadingDetail = ref(false);
  const isLoadingSessions = ref(false);
  const isStartingSession = ref(false);
  const error = ref<string | null>(null);

  const fetchSessions = async () => {
    try {
      isLoadingSessions.value = true;
      error.value = null;

      const response = await getAllSessions();

      if (response.status && Array.isArray(response.data)) {
        // Filter sessions berdasarkan role
        sessions.value = response.data.filter((s) => {
          if (userType.value === "mahasiswa") {
            // Mahasiswa: tampilkan session yang dia miliki
            return s.user_owner.id === userId.value;
          } else if (userType.value === "dosen") {
            // Dosen: tampilkan session dimana dia jadi supervisor
            return s.thesis.supervisors.some(
              (supervisor: { identifier: string }) =>
                supervisor.identifier === userIdentifier.value
            );
          }
          return false;
        });

        // Sort by start_time descending (terbaru dulu)
        sessions.value.sort((a, b) => {
          const dateA = new Date(a.start_time || 0).getTime();
          const dateB = new Date(b.start_time || 0).getTime();
          return dateB - dateA;
        });
      } else {
        console.warn("Unexpected session response format:", response);
        sessions.value = [];
      }
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      error.value =
        err.response?.data?.message || "Gagal memuat sesi bimbingan";
      sessions.value = [];
    } finally {
      isLoadingSessions.value = false;
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    if (!sessionId) {
      error.value = "Session ID tidak valid";
      return;
    }

    try {
      isLoadingDetail.value = true;
      error.value = null;

      const response = await getSessionDetail(sessionId);

      if (response.status && response.data) {
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        sessionDetail.value = data;

        return data;
      } else {
        throw new Error("Data sesi tidak ditemukan");
      }
    } catch (err: any) {
      console.error("❌ Error fetching session detail:", err);
      error.value = err.response?.data?.message || "Gagal memuat detail sesi";
      sessionDetail.value = null;
    } finally {
      isLoadingDetail.value = false;
    }
  };

  const startSession = async (thesisId: string) => {
    if (!thesisId) {
      error.value = "Thesis ID tidak ditemukan";
      throw new Error("Thesis ID tidak ditemukan");
    }

    isStartingSession.value = true;
    error.value = null;

    try {
      const response = await startNewSession(thesisId);

      if (response.status && response.data) {
        // Refresh sessions list after starting new session
        await fetchSessions();

        // Return single session data or first item if array
        const sessionData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        return sessionData;
      } else {
        // Handle error response
        const errorMsg =
          "message" in response
            ? response.message
            : "Gagal memulai sesi bimbingan";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error starting session:", err);
      error.value =
        err.response?.data?.message ||
        err.message ||
        "Gagal memulai sesi bimbingan";
      throw err;
    } finally {
      isStartingSession.value = false;
    }
  };

  return {
    sessions,
    sessionDetail,
    isLoadingSessions,
    isStartingSession,
    error,
    // methods
    fetchSessions,
    startSession,
    fetchSessionDetail,
  };
}
