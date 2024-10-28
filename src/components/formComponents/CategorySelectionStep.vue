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
        @click="selectedCategory(category.name)"
        class="service-card cursor-pointer flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:scale-105"
        v-for="category in categories"
        :key="category.name"
        :class="{ 'selected-category': isSelected(category) }"
      >
        <img
          :src="category.image"
          alt="Category image"
          class="w-full object-cover rounded-md mb-2"
        />
        <h2 class="text-m font-normal font-['DM_Sans']">{{ category.name }}</h2>
      </div>
    </div>
    <div class="flex justify-between items-center w-full mt-4">
      <!-- Prev Step button aligned to the left -->
      <div>
        <FormKit
          type="button"
          label="Prev Step"
          @click="backToPropertyStatusStep"
          class="mr-auto"
        />
      </div>
      <div>
        <!-- Next Step button aligned to the right -->
        <FormKit
          type="button"
          label="Next Step"
          @click="handleCategorySelected"
          class="ml-auto"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";
const selectedServiceCategory = ref("");

const emit = defineEmits(["categorySelected", "propertyStatusStep"]);

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

const isSelected = (record) => {
  return selectedServiceCategory.value === record.name;
};

// Function to select a category
const selectedCategory = (categoryName) => {
  selectedServiceCategory.value = categoryName;
};

const backToPropertyStatusStep = () => {
  emit("propertyStatusStep");
};

const handleCategorySelected = () => {
  emit("categorySelected", selectedServiceCategory.value);
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
.selected-category {
  border-color: #ff33cc; /* Border color for selected card */
}
</style>
