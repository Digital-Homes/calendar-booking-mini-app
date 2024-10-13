<template>
  <div>
    <h1>Choose the services you'd like</h1>
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
const emit = defineEmits(["serviceSelected"]);

const selectService = (service) => {
  emit("serviceSelected", service);
};
</script>

<style scoped></style>
