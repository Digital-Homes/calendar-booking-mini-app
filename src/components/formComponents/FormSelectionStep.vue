<template>
  <div>
    <h1>{{ welcomeMessage }}</h1>
    <div class="flex flex-col space-y-4">
      <FormKit
        type="button"
        @click="selectService('appointment')"
        :label="'Book an Appointment'"
        :classes="{ base: 'service-button' }"
      />
      <FormKit
        type="button"
        @click="selectService('editing')"
        :label="'Buy Virtual Editing Services'"
        :classes="{ base: 'service-button' }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"; // Import computed
const emit = defineEmits(["serviceSelected"]);
const props = defineProps(["userName"]); // Accept userName as a prop

const welcomeMessage = computed(() => {
  return props.userName
    ? `Welcome back, ${props.userName}!`
    : "Welcome to Digital Homes!";
});

const selectService = (service) => {
  emit("serviceSelected", service);
};
</script>

<style scoped></style>
