<script setup>
import { onMounted } from "vue";
import AdminConsole from "./AdminConsole.vue";
import FeedbackView from "./FeedbackView.vue";
import RoutePlannerView from "./RoutePlannerView.vue";
import VisitorWorkspace from "./VisitorWorkspace.vue";

const emit = defineEmits(["ready"]);

onMounted(() => emit("ready"));
</script>

<template>
  <div id="deferredViews">
    <VisitorWorkspace />
    <RoutePlannerView />
    <FeedbackView />
    <AdminConsole />
  </div>
</template>
