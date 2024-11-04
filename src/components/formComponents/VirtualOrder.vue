<template>
  <div class="mx-auto my-10">
    <SelectOrderType
      v-if="chosenOrdertype == ''"
      @uploadPhotos="handleUploadPhotosStep"
      @chooseFromOrder="handleChooseFromOrder"
      class="max-w-[768px] mx-auto"
      :userid="userID"
    />

    <GetPropertyAddress
      v-if="chosenOrdertype == 'uploadPhotos' && !propertyAddressEntered"
      @propertyAddressSubmitted="handlePropertyAddressSubmitted"
    />

    <UploadImages
      v-if="chosenOrdertype == 'uploadPhotos' && propertyAddressEntered"
      @selectOrderTypeStep="handleBackToOrderType"
      class="max-w-[768px] mx-auto"
    />

    <SelectPreviousOrder
      v-if="chosenOrdertype == 'chooseFromOrder' && userID != ''"
      class="max-w-[768px] mx-auto"
      :userid="userID"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from "vue";

import SelectOrderType from "../virtualComponents/SelectOrderType.vue";
import GetPropertyAddress from "../virtualComponents/GetPropertyAddress.vue";
import UploadImages from "../virtualComponents/UploadImages.vue";
import SelectPreviousOrder from "../virtualComponents/SelectPreviousOrder.vue";

const props = defineProps({
  userid: String,
});

const chosenOrdertype = ref("");
const userID = props.userid;
const propertyAddress = ref({
  location: "",
  zipcode: "",
});
const propertyAddressEntered = ref(false);

console.log(userID);

const handleUploadPhotosStep = () => {
  chosenOrdertype.value = "uploadPhotos";
  console.log("chose to upload");
  console.log(chosenOrdertype.value);
};

const handlePropertyAddressSubmitted = (address) => {
  propertyAddress.value.location = address.location;
  propertyAddress.value.zipcode = address.zipcode;
  propertyAddressEntered.value = true;
};

const handleChooseFromOrder = () => {
  chosenOrdertype.value = "chooseFromOrder";
  console.log("chose to choose from previous order");
  console.log(chosenOrdertype.value);
};

const handleBackToOrderType = () => {
  console.log("go back to otder type");
};
</script>
