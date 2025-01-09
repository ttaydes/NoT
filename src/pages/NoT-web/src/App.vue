  <script>
import LAN from "./components/LocalNetWork.vue";
import IP from "./components/InternetWork.vue";
import localconnector from "./components/LocalConnector.vue";

export default {
  components: {
    LAN,
    IP,
    localconnector,
  },
  data() {
    return {
      currentTab: "LAN",
      tabs: ["LAN", "IP"],
    };
  },
};
</script>

  <template>
  <div class="app-container">
    <!-- Tab Buttons -->

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-button', { active: currentTab === tab }]"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Dynamic Component Rendering -->
    <div class="tab-content">
      <keep-alive>
        <component :is="currentTab"></component>
      </keep-alive>
    </div>
  </div>
</template>

  <style scoped>
/* Overall container */
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 98vh;
  width: auto;
  background-color: rgb(84, 85, 85);
}

/* Tab buttons container */
.tabs {
  flex-direction: row;
  position: absolute;
  top: 7%;
  display: flex;
  justify-content: center;
  width: 90%;
  left: 3%;
  background-color: rgb(84, 85, 85);
}

/* Tab button styles */
.tab-button {
  padding: 10px 20px;
  margin: 0;
  width: 100px;
  font-size: 16px;
  border: none;
  background-color: #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  border-radius: 0;
  text-align: center;
}

.tab-button:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.tab-button:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.tab-button:hover {
  background-color: #bbb;
  transform: scale(1.05);
}

/* Active tab button styles */
.tab-button.active {
  background-color: #3e8e41;
  color: white;
}

.tab-button:focus {
  outline: none;
}

/* Tab content area */
.tab-content {
  display: flex;
  position: fixed;
  align-items: center;
  justify-content: center;
  width: 85%;
  height: 80%;
  bottom: 29px;
  background-color:rgb(71, 73, 73);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}
</style>
