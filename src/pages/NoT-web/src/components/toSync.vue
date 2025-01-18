<template>
  <div class="sync-container">
    <div class="sync-header">
      <div class="device-info">
        <span class="device-icon">🔗</span>
        <div class="device-details">
          <span class="device-label">连接设备</span>
          <h3 class="device-name">{{ device_name }}</h3>
        </div>
      </div>
      
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.name }}
        </button>
      </div>

      <button @click="$emit('close-sync', index)" class="close-btn">
        <span class="close-icon">×</span>
      </button>
    </div>

    <div class="sync-content">
      <transition name="fade" mode="out-in">
        <keep-alive>
          <component
            :is="currentPanel"
            :device_name="device_name"
            :device_ip="device_ip"
            :device_port="device_port"
          />
        </keep-alive>
      </transition>
    </div>
  </div>
</template>

<script>
import ClipboardPanel from "./sync/ClipboardPanel.vue";
import FileTransferPanel from "./sync/FileTransferPanel.vue";

export default {
  components: {
    ClipboardPanel,
    FileTransferPanel,
  },
  props: {
    index: Number,
    device_name: String,
    device_ip: String,
    device_port: String,
  },
  data() {
    return {
      activeTab: "clipboard",
      tabs: [
        { id: 'clipboard', name: '剪切板同步', icon: '📋' },
        { id: 'file', name: '文件传输', icon: '📁' }
      ]
    };
  },
  computed: {
    currentPanel() {
      return this.activeTab === 'clipboard' ? ClipboardPanel : FileTransferPanel;
    }
  },
};
</script>

<style scoped>

.sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f7f7f7;
  border-bottom: 1px solid #e2e8f0;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  font-size: 24px;
}

.device-details {
  display: flex;
  flex-direction: column;
}

.device-label {
  font-size: 12px;
  color: #64748b;
}

.device-name {
  font-size: 16px;
  color: #0f172a;
  margin: 0;
}

.tab-buttons {
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: #4CAF50;
  color: white;
}

.tab-icon {
  font-size: 16px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #64748b;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.sync-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 