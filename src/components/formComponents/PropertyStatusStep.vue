<template>
  <div>
    <h2 class="text-xl mb-4 font-['DM_Sans']">Check Property Status</h2>
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
      <FormKit type="submit" label="Next →" />
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
const emit = defineEmits(["propertyStatusSubmitted"]);

const submitPropertyStatus = () => {
  emit("propertyStatusSubmitted", propertyStatus.value);
};
</script>

<style scoped>
/* Add any specific styles for the property status step */
</style>
