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
      console.warn("⚠️ SessionDetail is null, senderMap will be empty");
      return new Map<string, string>();
    }

    const map = new Map<string, string>();

    try {
      // Add student to map
      if (sessionDetail.value.thesis?.student) {
        const student = sessionDetail.value.thesis.student;
        map.set(student.id, student.name);
        console.log(
          `✅ Added student to senderMap: ${student.id} → ${student.name}`
        );
      }

      // Add supervisors to map
      if (sessionDetail.value.thesis?.supervisors) {
        sessionDetail.value.thesis.supervisors.forEach(
          (supervisor: CustomUserResponse) => {
            map.set(supervisor.id, supervisor.name);
            console.log(
              `✅ Added supervisor to senderMap: ${supervisor.id} → ${supervisor.name}`
            );
          }
        );
      }

      console.log("📊 SenderMap built with", map.size, "entries");
    } catch (error) {
      console.error("❌ Error building sender map:", error);
    }

    return map;
  });

  // Watch for sessionDetail changes to debug
  watch(
    sessionDetail,
    (newVal) => {
      if (newVal) {
        console.log("🔄 SessionDetail changed:", {
          hasStudent: !!newVal.thesis?.student,
          supervisorCount: newVal.thesis?.supervisors?.length || 0,
        });
      }
    },
    { immediate: true }
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
            role: s.role,
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
    const senderName = message.sender.name;

    console.log("🔍 getSenderName lookup:", {
      sender_id: senderId,
      sender_name_in_message: senderName,
      senderMap_size: senderMap.value.size,
      in_senderMap: senderMap.value.has(senderId),
    });

    // Priority 1: Use sender.name from message if available and not "Unknown"
    if (senderName && senderName !== "Unknown") {
      console.log("✅ Using sender.name from message:", senderName);
      return senderName;
    }

    // Priority 2: Look up in senderMap
    const nameFromMap = senderMap.value.get(senderId);
    if (nameFromMap) {
      console.log("✅ Found in senderMap:", nameFromMap);
      return nameFromMap;
    }

    // Priority 3: Search in sessionDetail
    if (sessionDetail.value?.thesis) {
      const student = sessionDetail.value.thesis.student;
      if (student?.id === senderId) {
        console.log("✅ Found as student:", student.name);
        return student.name;
      }

      const supervisor = sessionDetail.value.thesis.supervisors?.find(
        (s: CustomUserResponse) => s.id === senderId
      );
      if (supervisor?.name) {
        console.log("✅ Found as supervisor:", supervisor.name);
        return supervisor.name;
      }
    }

    console.error("❌ Sender not found:", {
      sender_id: senderId,
      available_in_map: Array.from(senderMap.value.entries()),
      sessionDetail_loaded: !!sessionDetail.value,
    });

    return "Unknown";
  };

  const isMyMessage = (message: Message): boolean => {
    const isMine = message.sender.id === userId.value;

    if (!isMine) {
      console.log("🔍 isMyMessage check:", {
        message_sender_id: message.sender.id,
        message_sender_name: message.sender.name,
        current_userId: userId.value,
        isMine: false,
      });
    }

    return isMine;
  };

  const addOnlineParticipant = (participantId: string): void => {
    onlineParticipants.value.add(participantId);
    console.log("✅ Participant online:", participantId);
  };

  const removeOnlineParticipant = (participantId: string): void => {
    onlineParticipants.value.delete(participantId);
    console.log("⚠️ Participant offline:", participantId);
  };

  const clearOnlineParticipants = (): void => {
    onlineParticipants.value.clear();
    console.log("🧹 Cleared all online participants");
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
