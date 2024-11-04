<template>
  <div class="flex flex-col items-center pt-10 md:pt-20">
    <FormKit type="form">
      <div class="flex space-x-8">
        <!-- Card 1: Upload Your Own Images -->
        <div
          class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          @click="selectOption('upload')"
        >
          <img
            src="https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png"
            alt="Upload Images"
            class="w-full h-50 object-cover rounded-md mb-2"
          />
          <h4 class="text-m font-normal font-['DM_Sans']">
            Upload Your Own Images
          </h4>
        </div>

        <!-- Card 2: Select from Previous Orders -->
        <div
          v-if="customerId != ''"
          class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          @click="selectOption('previous')"
        >
          <img
            src="https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png"
            alt="Select from Previous Orders"
            class="w-full h-50 object-cover rounded-md mb-2"
          />
          <h4 class="text-m font-normal font-['DM_Sans']">
            Select from Previous Orders
          </h4>
        </div>
      </div>
    </FormKit>
  </div>
</template>

<script setup>
import { defineEmits, defineProps } from "vue";

const props = defineProps({
  userid: String,
});

const customerId = props.userid;

const emit = defineEmits(["uploadPhotos", "chooseFromOrder"]);

const selectOption = (option) => {
  if (option === "upload") emit("uploadPhotos");
  if (option === "previous") emit("chooseFromOrder");
};
</script>

<style scoped>
/* Add specific styles if needed */
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
