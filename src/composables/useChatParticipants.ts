// composables/useChatParticipants.ts
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
            role: s.role as
              | "student"
              | "primary_supervisor"
              | "secondary_supervisor",
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

  const getSenderName = (message: Message | Record<string, any>): string => {
    if (!message || !message.sender_id) return "Unknown";

    const senderFromMap = senderMap.value.get(message.sender_id);
    if (senderFromMap) {
      return senderFromMap;
    }

    if (message.sender_name) {
      return message.sender_name;
    }

    if (sessionDetail.value?.thesis) {
      const student = sessionDetail.value.thesis.student;
      if (student?.id === message.sender_id) {
        return student.name;
      }

      const supervisor = sessionDetail.value.thesis.supervisors?.find(
        (s: CustomUserResponse) => s.id === message.sender_id
      );
      if (supervisor?.name) {
        return supervisor.name;
      }
    }

    console.warn(`Sender not found for ID: ${message.sender_id}`);
    return "Unknown";
  };

  const isMyMessage = (message: Message): boolean => {
    return message.sender_id === userId.value;
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
