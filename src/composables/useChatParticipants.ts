import { ref, computed, watch, type Ref } from "vue";
import type { Participant, Message } from "../types/message";
import type { SessionResponse } from "../types/session";
import type { CustomUserResponse } from "../types/user";

export const useChatParticipants = (
  sessionDetail: Ref<SessionResponse | null>,
  userId: Ref<string>
) => {
  const onlineParticipants = ref<Set<string>>(new Set());

  const senderMap = computed<Map<string, string>>(() => {
    if (!sessionDetail.value) {
      console.log("⚠️ senderMap: sessionDetail is null");
      return new Map<string, string>();
    }

    const map = new Map<string, string>();

    try {
      if (sessionDetail.value.thesis?.student) {
        const student = sessionDetail.value.thesis.student;
        map.set(student.id, student.name);
        console.log(
          "📝 Added student to senderMap:",
          student.id,
          "->",
          student.name
        );
      }

      if (sessionDetail.value.thesis?.supervisors) {
        sessionDetail.value.thesis.supervisors.forEach(
          (supervisor: CustomUserResponse) => {
            map.set(supervisor.id, supervisor.name);
            console.log(
              "📝 Added supervisor to senderMap:",
              supervisor.id,
              "->",
              supervisor.name
            );
          }
        );
      }

      console.log("✅ senderMap built with", map.size, "entries");
    } catch (error) {
      console.error("Error building sender map:", error);
    }

    return map;
  });

  // Watch for sessionDetail changes
  watch(
    sessionDetail,
    (newVal) => {
      if (newVal) {
        console.log("📊 SessionDetail updated:", {
          student: newVal.thesis?.student?.name,
          supervisors: newVal.thesis?.supervisors?.map((s) => s.name),
        });
      }
    },
    { immediate: true, deep: true }
  );

  const allParticipants = computed<Participant[]>(() => {
    if (!sessionDetail.value) return [];

    const participants: Participant[] = [];

    if (sessionDetail.value.thesis?.student) {
      participants.push({
        id: sessionDetail.value.thesis.student.id,
        name: sessionDetail.value.thesis.student.name,
        identifier: sessionDetail.value.thesis.student.identifier,
        role: "student",
        online: onlineParticipants.value.has(
          sessionDetail.value.thesis.student.id
        ),
      });
    }

    if (sessionDetail.value.thesis?.supervisors) {
      sessionDetail.value.thesis.supervisors.forEach(
        (s: CustomUserResponse) => {
          participants.push({
            id: s.id,
            name: s.name,
            identifier: s.identifier,
            role: s.role as "primary_supervisor" | "secondary_supervisor",
            online: onlineParticipants.value.has(s.id),
          });
        }
      );
    }

    return participants;
  });

  const otherParticipants = computed<Participant[]>(() => {
    return allParticipants.value.filter((p) => p.id !== userId.value);
  });

  const getSenderName = (
    message: Message | { sender: CustomUserResponse } | null | undefined
  ): string => {
    if (!message || !("sender" in message) || !message.sender) {
      console.warn("⚠️ getSenderName: Invalid message object");
      return "Unknown";
    }

    const senderId = message.sender.id;
    const senderNameFromObject = message.sender.name;

    // Priority 1: Use name from message sender object if valid
    if (
      senderNameFromObject &&
      senderNameFromObject !== "Unknown" &&
      senderNameFromObject !== "" &&
      senderNameFromObject !== "Loading..."
    ) {
      return senderNameFromObject;
    }

    // Priority 2: Get from senderMap (from sessionDetail)
    const senderFromMap = senderMap.value.get(senderId);
    if (senderFromMap) {
      console.log("✅ Using senderMap for", senderId, "->", senderFromMap);
      return senderFromMap;
    }

    // Priority 3: Fallback to sessionDetail direct lookup
    if (!sessionDetail.value?.thesis) {
      console.warn("⚠️ sessionDetail.thesis not available");
      return "Loading...";
    }

    // Check student
    const student = sessionDetail.value.thesis.student;
    if (student?.id === senderId) {
      return student.name;
    }

    // Check supervisors
    const supervisors = sessionDetail.value.thesis.supervisors;
    if (supervisors) {
      const supervisor = supervisors.find(
        (s: CustomUserResponse) => s.id === senderId
      );
      if (supervisor?.name) {
        return supervisor.name;
      }
    }

    // Priority 4: Generic fallback by role
    if (message.sender.role === "student") {
      return student?.name || "Mahasiswa";
    }

    if (
      message.sender.role === "lecturer" ||
      message.sender.role === "supervisor"
    ) {
      return "Dosen";
    }

    console.error(`❌ Sender not found for ID: ${senderId}`);
    console.log("📊 senderMap:", Array.from(senderMap.value.entries()));

    return "Unknown";
  };

  const isMyMessage = (message: Message): boolean => {
    return message.sender.id === userId.value;
  };

  const addOnlineParticipant = (participantId: string): void => {
    onlineParticipants.value.add(participantId);
  };

  const removeOnlineParticipant = (participantId: string): void => {
    onlineParticipants.value.delete(participantId);
  };

  const clearOnlineParticipants = (): void => {
    onlineParticipants.value.clear();
  };

  return {
    onlineParticipants,
    senderMap,
    allParticipants,
    otherParticipants,
    getSenderName,
    isMyMessage,
    addOnlineParticipant,
    removeOnlineParticipant,
    clearOnlineParticipants,
  };
};
