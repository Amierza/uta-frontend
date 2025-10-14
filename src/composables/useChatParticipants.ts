import { ref, computed, type Ref } from "vue";
import type { Participant, Message } from "../types/message";
import type { SessionResponse } from "../types/session";
import type { CustomUserResponse } from "../types/user";

export const useChatParticipants = (
  sessionDetail: Ref<SessionResponse | null>,
  userId: Ref<string>
) => {
  const onlineParticipants = ref<Set<string>>(new Set());

  const senderMap = computed<Map<string, string>>(() => {
    if (!sessionDetail.value) return new Map<string, string>();

    const map = new Map<string, string>();

    try {
      if (sessionDetail.value.thesis?.student) {
        const student = sessionDetail.value.thesis.student;
        map.set(student.id, student.name);
      }

      if (sessionDetail.value.thesis?.supervisors) {
        sessionDetail.value.thesis.supervisors.forEach(
          (supervisor: CustomUserResponse) => {
            map.set(supervisor.id, supervisor.name);
          }
        );
      }
    } catch (error) {
      console.error("Error building sender map:", error);
    }

    return map;
  });

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
      console.warn("⚠️ getSenderName: Invalid message object", message);
      return "Unknown";
    }

    console.log("🔍 getSenderName called for:", {
      sender_id: message.sender.id,
      sender_name: message.sender.name,
      has_senderMap: senderMap.value.has(message.sender.id),
    });

    // Get from sender object directly
    if (message.sender.name && message.sender.name !== "Unknown") {
      console.log("✅ Using sender.name:", message.sender.name);
      return message.sender.name;
    }

    // Fallback to sender map
    const senderFromMap = senderMap.value.get(message.sender.id);
    if (senderFromMap) {
      console.log("✅ Using senderMap:", senderFromMap);
      return senderFromMap;
    }

    // Fallback to session detail
    if (sessionDetail.value?.thesis) {
      const student = sessionDetail.value.thesis.student;
      if (student?.id === message.sender.id) {
        console.log("✅ Using session student:", student.name);
        return student.name;
      }

      const supervisor = sessionDetail.value.thesis.supervisors?.find(
        (s: CustomUserResponse) => s.id === message.sender.id
      );
      if (supervisor?.name) {
        console.log("✅ Using session supervisor:", supervisor.name);
        return supervisor.name;
      }
    }

    console.warn(`❌ Sender not found for ID: ${message.sender.id}`);
    console.log(
      "📊 Available senderMap:",
      Array.from(senderMap.value.entries())
    );
    return "Unknown";
  };

  const isMyMessage = (message: Message): boolean => {
    const isMine = message.sender.id === userId.value;
    console.log("🔍 isMyMessage check:", {
      message_sender_id: message.sender.id,
      current_userId: userId.value,
      isMine,
    });
    return isMine;
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
