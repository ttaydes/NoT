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
  height: 100vh;

  background-color: white;
}

/* Tab buttons container */
.tabs {
  flex-direction: row; /* 水平排列 */
  position: absolute;
  top: 10%; /* Adjust this value to move the tabs higher or lower */
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 0;
}

/* Tab button styles */
.tab-button {
  padding: 10px 20px;
  margin: 0 10px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background-color: #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
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
  width: 80%;
  height: 68%;
  position: relative;
  background-color: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 20px;
}
</style>
