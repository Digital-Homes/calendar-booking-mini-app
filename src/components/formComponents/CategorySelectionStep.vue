<template>
  <div v-if="!categorySelectionSubmitted">
    <h2>Select a Service Category</h2>
    <div class="category-cards">
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
    </div>
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
.category-cards {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.category-card {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s;
}

.category-card:hover {
  transform: scale(1.05);
}

.category-image {
  max-width: 100%;
  height: auto;
}
</style>
