<template>
  <div class="flex flex-col items-center pt-10 md:pt-20">
    <h1 class="text-2xl font-bold mb-4">Choose the services you'd like</h1>
    <div class="flex space-x-4">
      <!-- Appointment Service Card -->
      <div
        @click="selectService('appointment')"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        <img
          src=""
          alt="Book an Appointment"
          class="w-full h-32 object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal">Book an Appointment</h2>
      </div>

      <!-- Editing Service Card -->
      <div
        @click="selectService('editing')"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        <img
          src=""
          alt="Buy Virtual Editing Services"
          class="w-full h-32 object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal">Buy Virtual Editing Services</h2>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["serviceSelected"]);

const selectService = (service) => {
  emit("serviceSelected", service);
};
</script>

<style scoped>
.service-card {
  width: 300px; /* Fixed width */
  height: 180px; /* Fixed height to accommodate varying text */
  border-radius: 12px; /* Radius */
  border: 1.5px solid #ccc; /* Border */
  padding: 22px 35px; /* Padding: top-bottom 22px, left-right 35px */
  gap: 21px; /* Gap between items */
  display: flex; /* Flexbox for inner alignment */
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
  justify-content: center; /* Center items vertically */
}
</style>
