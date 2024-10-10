<template>
  <div class="mx-auto my-16 max-w-[768px]">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />

    <!-- Email verification step -->
    <EmailStep v-if="!stepCompleted" @emailChecked="handleEmailChecked" />

    <!-- Service selection step -->
    <FormSelectionStep
      v-if="stepCompleted && !serviceSelected"
      :userName="userInfo.name"
      @serviceSelected="handleServiceSelected"
    />

    <!-- property information step -->
    <PropertyInfoStep
      v-if="
        stepCompleted &&
        serviceSelected === 'appointment' &&
        !propertyInfoSubmitted
      "
      @propertyInfoSubmitted="handlePropertyInfoSubmitted"
    />

    <PropertyStatusStep
      v-if="
        stepCompleted &&
        serviceSelected &&
        propertyInfoSubmitted &&
        !propertyStatusSubmitted
      "
      @propertyStatusSubmitted="handlePropertyStatusSubmitted"
    />

    <CategorySelectionStep
      v-if="propertyStatusSubmitted && !categorySelectionSubmitted"
      @categorySelected="handleCategorySelected"
    />

    <ProductList
      v-if="propertyStatusSubmitted && categorySelectionSubmitted"
      :category="selectedCategory"
      :squareFootage="propertyInfo.squareFootage"
    />

    <!-- Future steps will be placed here -->
  </div>
</template>

<script setup>
import { ref } from "vue";
import EmailStep from "./formComponents/EmailStep.vue";
import FormSelectionStep from "./formComponents/FormSelectionStep.vue";
import PropertyInfoStep from "./formComponents/PropertyInfoStep.vue";
import PropertyStatusStep from "./formComponents/PropertyStatusStep.vue";
import CategorySelectionStep from "./formComponents/CategorySelectionStep.vue";
import ProductList from "./formComponents/ProductList.vue";

const stepCompleted = ref(false);
const userInfo = ref({ email: "", name: "" });
const serviceSelected = ref(null);
const propertyInfo = ref({
  location: "",
  squareFootage: 0, // Initialize as a number
  notes: "",
});

const propertyInfoSubmitted = ref(false);
const propertyStatusSubmitted = ref(false);
const categorySelectionSubmitted = ref(false);
const selectedCategory = ref("");

const handleEmailChecked = (data) => {
  userInfo.value.email = data.email;
  userInfo.value.name = data.name;
  stepCompleted.value = true;
};

const handleServiceSelected = (service) => {
  serviceSelected.value = service;
  // You can handle redirection logic here based on the selected service
  // e.g., this.$router.push('/appointment') or this.$router.push('/editing-services')
};

const handlePropertyInfoSubmitted = (info) => {
  propertyInfo.value = {
    location: info.location,
    squareFootage: parseFloat(info.squareFootage), // Convert to number if it's a string
    notes: info.notes,
  };
  console.log("Property Info Submitted:", propertyInfo.value);
  propertyInfoSubmitted.value = true;
};

const handlePropertyStatusSubmitted = (propertyStatus) => {
  // Handle the property status here
  console.log("Selected Property Status:", propertyStatus);
  propertyStatusSubmitted.value = true;
};

const handleCategorySelected = (category) => {
  console.log("Selected Category:", category);
  selectedCategory.value = category; // Add this line to store the selected category
  categorySelectionSubmitted.value = true;
};
</script>

<style scoped>
/* Global styles for the multi-step form */
</style>
