<template>
  <div>
    <h2 class="text-xl mb-4 font-['DM_Sans']">Property Status</h2>
    <h4 class="text-m mb-4 font-['DM_Sans']">Please check all that apply</h4>
    <form @submit.prevent="submitPropertyStatus" class="font-['DM_Sans']">
      <FormKit
        type="checkbox"
        v-model="propertyStatus.ownerOccupied"
        label="Owner Occupied"
      />
      <FormKit
        type="checkbox"
        v-model="propertyStatus.tenantOccupied"
        label="Tenant Occupied"
      />
      <FormKit type="checkbox" v-model="propertyStatus.vacant" label="Vacant" />
      <FormKit
        type="checkbox"
        v-model="propertyStatus.furnishedOrStaged"
        label="Furnished or Staged"
      />
      <FormKit
        type="checkbox"
        v-model="propertyStatus.unfurnished"
        label="Unfurnished"
      />
      <FormKit
        type="checkbox"
        v-model="propertyStatus.commercialProperty"
        label="Commercial Property"
      />
      <div class="flex justify-between items-center w-full mt-4">
        <!-- Prev Step button aligned to the left -->
        <div>
          <FormKit
            type="button"
            label="Prev Step"
            @click="backToPropertyInfoStep"
            class="mr-auto"
          />
        </div>
        <div>
          <!-- Next Step button aligned to the right -->
          <FormKit type="submit" label="Next Step" class="ml-auto" />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const propertyStatus = ref({
  ownerOccupied: false,
  tenantOccupied: false,
  vacant: false,
  furnishedOrStaged: false,
  unfurnished: false,
  commercialProperty: false,
});

// Emit the selected property status back to the parent
const emit = defineEmits(["propertyStatusSubmitted", "propertyInfoStep"]);

const submitPropertyStatus = () => {
  emit("propertyStatusSubmitted", propertyStatus.value);
};

const backToPropertyInfoStep = () => {
  console.log("back button pressed");
  emit("propertyInfoStep");
};
</script>

<style scoped>
/* Add any specific styles for the property status step */
</style>
