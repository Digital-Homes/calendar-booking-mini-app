<template>
  <div class="flex flex-col items-center pt-10 md:pt-20">
    <h2 class="text-xl mb-4 font-['DM_Sans']">
      Please select an order form below to continue.
    </h2>
    <div class="flex space-x-8">
      <!-- Appointment Service Card -->
      <div
        @click="selectService('appointment')"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        <img
          src="https://res.cloudinary.com/digital-homes/image/upload/v1729430269/photography_e2mxgn.png"
          alt="Book an Appointment"
          class="w-full h-40 object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal font-['DM_Sans']">Book an Appointment</h2>
      </div>

      <!-- Editing Service Card -->
      <div
        @click="selectService('editing')"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        <img
          src="https://res.cloudinary.com/digital-homes/image/upload/v1729430266/virtual-staging_inucpj.png"
          alt="Buy Virtual Editing Services"
          class="w-full h-40 object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal font-['DM_Sans']">
          Buy Virtual Editing Services
        </h2>
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
  height: 300px; /* Fixed height to accommodate varying text */
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
