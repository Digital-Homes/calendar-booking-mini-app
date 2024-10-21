<template>
  <div>
    <h2
      class="text-xl mb-4 font-['DM_Sans'] flex flex-col items-center justify-center mt-20"
    >
      Select a Service Category
    </h2>
    <div class="flex space-x-8">
      <!-- Appointment Service Card -->
      <div
        @click="selectCategory(category.name)"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
        v-for="category in categories"
        :key="category.name"
      >
        <img
          :src="category.image"
          alt="Category image"
          class="w-full object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal font-['DM_Sans']">{{ category.name }}</h2>
      </div>
    </div>
    <!-- <div class="category-cards">
      <div
        class="category-card"
        v-for="category in categories"
        :key="category.name"
        @click="selectCategory(category.name)"
      >
        <img
          :src="category.image"
          alt="Category image"
          class="category-image"
        />
        <h2>{{ category.name }}</h2>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["categorySelected"]);

// Define categories as a ref
const categories = ref([
  {
    name: "Individual Services",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
  {
    name: "Bundled Services",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
  {
    name: "Luxury & Interior Design",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
]);

// Function to select a category
const selectCategory = (categoryName) => {
  emit("categorySelected", categoryName);
};
</script>

<style scoped>
.service-card {
  width: 300px; /* Fixed width */
  height: 300px; /* Fixed height to accommodate varying text */
  border-radius: 12px; /* Radius */
  border: 1.5px solid #ccc; /* Border */
  padding: 22px 15px; /* Padding: top-bottom 22px, left-right 35px */
  gap: 21px; /* Gap between items */
  display: flex; /* Flexbox for inner alignment */
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
  justify-content: center; /* Center items vertically */
}
</style>
