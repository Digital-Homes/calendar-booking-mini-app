<template>
  <div class="mx-auto my-16 max-w-[768px]">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />

    <!-- Display Total Items and Total Price -->
    <div v-if="cart.items.length > 0" class="cart-summary">
      <h3>Total Items: {{ cart.items.length }}</h3>
      <h3>Total Price: ${{ totalPrice.toFixed(2) }}</h3>
    </div>

    <div v-if="selectedProducts.length > 0">
      <FormKit
        type="button"
        label="Choose Add-Ons"
        v-if="hasAddOns"
        @click="chooseAddOns"
      />
      <FormKit type="button" label="Show Photographer" v-else />
    </div>

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
      v-if="
        propertyStatusSubmitted &&
        categorySelectionSubmitted &&
        !addOnSelectionStep
      "
      :category="selectedCategory"
      :squareFootage="propertyInfo.squareFootage"
      @goBackToCategories="handleGoBackToCategories"
      @updateCart="handleCartUpdate"
    />

    <AddOnSelection
      v-if="addOnSelectionStep"
      @goBack="addOnSelectionStep = false"
      :selectedProducts="selectedProducts"
      @addToCart="updateCart"
    />

    <!-- Future steps will be placed here -->
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from "vue";
import EmailStep from "./formComponents/EmailStep.vue";
import FormSelectionStep from "./formComponents/FormSelectionStep.vue";
import PropertyInfoStep from "./formComponents/PropertyInfoStep.vue";
import PropertyStatusStep from "./formComponents/PropertyStatusStep.vue";
import CategorySelectionStep from "./formComponents/CategorySelectionStep.vue";
import ProductList from "./formComponents/ProductList.vue";
import AddOnSelection from "./formComponents/AddOnSelection.vue";

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
const selectedProducts = ref([]);
const addOnSelectionStep = ref(false);

const emit = defineEmits(["updateCart"]);

const cart = ref({
  items: [],
  totalPrice: 0,
});

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
  propertyInfoSubmitted.value = true;
};

const handlePropertyStatusSubmitted = (propertyStatus) => {
  // Handle the property status here
  propertyStatusSubmitted.value = true;
};

const handleCategorySelected = (category) => {
  selectedCategory.value = category; // Add this line to store the selected category
  categorySelectionSubmitted.value = true;
};

const handleGoBackToCategories = () => {
  // Reset the state for category selection
  categorySelectionSubmitted.value = false;
  selectedCategory.value = "";
  // You can also reset any other states if necessary
};

const totalPrice = computed(() => {
  return cart.value.totalPrice; // Calculate total price based on items in cart
});
const totalItems = computed(() => cart.value.items.length);

const updateCart = (addOn) => {
  // Check if the add-on is already in the cart
  const existingAddOn = cart.value.items.find((item) => item.id === addOn.id);

  if (!existingAddOn) {
    cart.value.items.push(addOn); // Add new add-on to the cart
  }

  cart.value.totalPrice += addOn.fields.Price; // Update total price
};

const hasAddOns = computed(() => {
  return selectedProducts.value.some(
    (product) =>
      product.fields["Add-ons"] && product.fields["Add-ons"].length > 0
  );
});

const handleCartUpdate = (newCart) => {
  selectedProducts.value = newCart; // Update your selected products with the new cart
  // Additional logic can go here if needed
};

watch(selectedProducts, (newVal) => {
  // Emit an updateCart event whenever the selected products change
  emit("updateCart", newVal);
});

const chooseAddOns = () => {
  addOnSelectionStep.value = true; // Show the AddOnSelection component
};
</script>

<style scoped>
/* Global styles for the multi-step form */
</style>
