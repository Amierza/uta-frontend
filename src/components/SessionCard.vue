<script setup lang="ts">
import { computed } from "vue";
import type { SessionResponse } from "../types/session";
import ParticipantsAvatar from "./ParticipantsAvatar.vue";

interface Props {
  session: SessionResponse;
  userType: "mahasiswa" | "dosen";
  userId: string;
}

const props = defineProps<Props>();

// Format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    return `${diffInMinutes} mnt lalu`;
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInHours < 48) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }
};

// Get all participants (student + supervisors)
const participants = computed(() => {
  const student = props.session.thesis.student;
  const supervisors = props.session.thesis.supervisors;
  return [student, ...supervisors];
});

// Get group chat title
const groupTitle = computed(() => {
  const student = props.session.thesis.student;
  const supervisors = props.session.thesis.supervisors;

  if (props.userType === "mahasiswa") {
    // Mahasiswa sees supervisors names
    if (supervisors.length === 1) {
      return supervisors[0].name;
    } else if (supervisors.length === 2) {
      return `${supervisors[0].name.split(" ")[0]} & ${
        supervisors[1].name.split(" ")[0]
      }`;
    } else {
      return `${supervisors[0].name.split(" ")[0]} & ${
        supervisors.length - 1
      } lainnya`;
    }
  } else {
    // Dosen sees student name + other supervisor if exists
    const otherSupervisors = supervisors.filter((s) => s.id !== props.userId);
    if (otherSupervisors.length === 0) {
      return student.name;
    } else if (otherSupervisors.length === 1) {
      return `${student.name.split(" ")[0]} & ${
        otherSupervisors[0].name.split(" ")[0]
      }`;
    } else {
      return `${student.name.split(" ")[0]} & ${
        otherSupervisors.length
      } lainnya`;
    }
  }
});

// Get status badge color
const statusConfig = computed(() => {
  switch (props.session.status) {
    case "active":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500",
        label: "Berlangsung",
      };
    case "finished":
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-200",
        dot: "bg-gray-400",
        label: "Selesai",
      };
    case "pending":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        dot: "bg-yellow-500",
        label: "Menunggu",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-200",
        dot: "bg-gray-400",
        label: props.session.status,
      };
  }
});

// Get progress badge text
const progressText = computed(() => {
  const progress = props.session.thesis.progress.toLowerCase();
  const progressMap: Record<string, string> = {
    bab1: "BAB 1",
    bab2: "BAB 2",
    bab3: "BAB 3",
    bab4: "BAB 4",
    bab5: "BAB 5",
    proposal: "Proposal",
    sidang: "Sidang",
  };
  return progressMap[progress] || progress.toUpperCase();
});
</script>

<template>
  <div
    class="group relative p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm"
  >
    <div class="flex items-start gap-4">
      <!-- Participants Avatar -->
      <ParticipantsAvatar
        :participants="participants"
        :is-active="session.status === 'active'"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title & Time -->
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex-1 min-w-0">
            <h4
              class="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors"
            >
              {{ groupTitle }}
            </h4>
            <p class="text-sm text-gray-600 truncate mt-0.5">
              {{ session.thesis.title }}
            </p>
          </div>
          <span class="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            {{ formatTime(session.start_time || "") }}
          </span>
        </div>

        <!-- Meta Info -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Status Badge -->
          <span
            :class="[
              'inline-flex items-center text-xs px-2.5 py-1 rounded-md border font-medium',
              statusConfig.bg,
              statusConfig.text,
              statusConfig.border,
            ]"
          >
            <span
              :class="['w-1.5 h-1.5 rounded-full mr-1.5', statusConfig.dot]"
            ></span>
            {{ statusConfig.label }}
          </span>

          <!-- Progress Badge -->
          <span
            class="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 font-medium"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"
              />
            </svg>
            {{ progressText }}
          </span>

          <!-- Participants Count -->
          <span
            class="inline-flex items-center text-xs text-gray-500 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
              />
            </svg>
            {{ participants.length }}
          </span>
        </div>
      </div>

      <!-- Arrow Icon -->
      <div
        class="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
