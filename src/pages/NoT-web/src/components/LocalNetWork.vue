<script>
import ErrorSlot from "./../views/ErrorSlot.vue";
import io from "socket.io-client"; // 导入 socket.io-client
import localconnector from "./LocalConnector.vue";
import lk from "./LinkFrame.vue";
import syncpanel from "./toSync.vue";
export default {
  components: {
    ErrorSlot,
    localconnector,
    lk,
    syncpanel
  },

  data() {
    return {
      localIPs: [], // 用于存储扫描到的局域网 IP 地址
      error: "", // 用于存储错误信息
      selectedIP: "", // 存储用户选择的 IP 地址
      isListening: false, // 用于标记是否正在监听局域网服务
      inputError: false, // 用于标记输入框是否出错
      isServiceOpen: false,
      socket: null, // 用于存储 WebSocket 连接实例
      socketefws: null, // 存储efws实例
      online_dev: "", // 所有在线的设备
      linkPort: 33451, //连接端口
      isdevconnected: false, //记录连接设备列表是否有设备
      
      connecteddev: [],
      panelPosition: {
        x: 0,
        y: 0
      },
      isDragging: false,
      dragOffset: {
        x: 0,
        y: 0
      },
      panels: [], // 新增：存储所有打开的面板
    };
  },

  // 在组件挂载时自动触发获取 IP 地址
  async mounted() {
    await this.scanLocalIPs();
  },

  methods: {
    validateIP() {
      // IPv4 format validation
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      // IPv6 format validation
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$/;
      // Chinese characters check
      const hanziRegex = /[\u4e00-\u9fa5]/;

      // Clear error state if input is empty
      if (!this.selectedIP.trim()) {
        this.error = "";
        this.inputError = false;
        return;
      }

      if (hanziRegex.test(this.selectedIP)) {
        this.error = "IP地址不能包含汉字";
        this.inputError = true;
        return;
      }

      if (!ipv4Regex.test(this.selectedIP) && !ipv6Regex.test(this.selectedIP)) {
        this.error = "请输入有效的IPv4或IPv6地址";
        this.inputError = true;
        return;
      }

      this.error = "";
      this.inputError = false;
    },
    validatePort() {
      // Clear error state if input is empty
      if (!this.linkPort || this.linkPort.trim() === '') {
        this.error = "";
        this.inputError = false;
        return;
      }

      // Check for non-numeric characters
      if (!/^\d+$/.test(this.linkPort)) {
        this.error = "端口号只能包含数字";
        this.inputError = true;
        this.linkPort = this.linkPort.replace(/\D/g, '');
        return;
      }

      // Convert to number for range checking
      const portNumber = Number(this.linkPort);
      
      // Check port range (0-65535)
      if (portNumber < 0 || portNumber > 65535) {
        this.error = "端口号必须在0-65535之间";
        this.inputError = true;
        this.linkPort = this.linkPort.slice(0, -1);
        return;
      }

      this.error = "";
      this.inputError = false;
    },
    // 扫描本机所有内网IP
    async scanLocalIPs() {
      this.localIPs = []; // 清空 IP 数组
      this.error = ""; // 清空错误信息

      try {
        const response = await fetch("http://127.0.0.1:5001/api/getlocalip");
        const data = await response.json();

        if (data.localIPs && data.localIPs.length > 0) {
          this.localIPs = data.localIPs; // 设置扫描到的 IP 地址
        } else {
          this.error = "未发现 IP 地址"; // 如果没有扫描到 IP 地址
        }
      } catch (err) {
        console.error("Error scanning local IPs:", err);
        this.error = "获取局域网 IP 失败，请检查网络连接或重试。"; // 请求失败时显示的错误信息
      }
    },

    // 切换监听状态
    async toggleListening() {
      this.listen_action = this.isListening ? "0" : "1";

      try {
        const response = await fetch(
          `http://127.0.0.1:5001/api/listenserver?ls=${this.listen_action}` //调用监听接口
        );
        const data = await response.json();
        if (data.status == "1" && !this.isListening) {
          this.isListening = true;
          this.online_dev = "";
          this.setupWebSocket();
        } else if (data.status == "2" && this.isListening) {
          this.isListening = false;
          this.closeWebSocket();
        }
      } catch (err) {
        this.buttonText = "监听局域网服务";
        this.error = "查找错误"; // 请求失败时显示的错误信息
      }
    },

    // 连接到选择的 IP 地址
    async serverOpen() {
      // Don't allow service start if there are validation errors
      if (this.inputError || this.error) {
        return;
      }

      this.action = this.isServiceOpen ? "0" : "1";

      try {
        const response = await fetch(
          `http://127.0.0.1:5001/api/serv?ip=${this.selectedIP}&port=${this.linkPort}&isopen=${this.action}`
        );

        const data = await response.json();

        if (data.status_id === 1) {
          this.isServiceOpen = true;
          this.setupEFws();
        } else if (data.status_id === 2) {
          this.isServiceOpen = false;
        } else {
          this.error = "服务开启失败";
        }
      } catch (err) {
        this.error = "获取局域网 IP 失败，请检查网络连接或重试。";
      }
    },

    setupEFws() {
      this.socketefws = new WebSocket("ws://127.0.0.1:33456?userId=frontws");

      // Connection opened
      this.socketefws.onopen = () => {
        console.log("Connected to backend WebSocket");
      };

      // Listen for messages
      this.socketefws.onmessage = (event) => {
        const fromlocaldevdata = event.data.toString();
        // 解析外层的 JSON
        const outerData = JSON.parse(fromlocaldevdata);
        // 解析内层的 JSON 字符串
        const deviceData = JSON.parse(outerData.fromlocaldev);
        console.log(deviceData);
        if (deviceData.status == "accept") {
          this.addDevicelist(
            deviceData.localreqlinknames,
            deviceData.localreqlinkip,
            deviceData.localreqlinkport
          );
        } else if (deviceData.status == "reject") {
          // 重写remove
          this.connecteddev.forEach((device) => {
            if (device.id === deviceData.localreqlinknames) {
              device.status_dev = false;
              device.opensyncpanel = false;
            }
          });
          if (this.connecteddev.every((device) => !device.status_dev)) {
            this.isdevconnected = false;
          }
        }
      };
      this.socketefws.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
      });
      console.log(this.connecteddev);
    }, // 建立node EFws

    setupWebSocket() {
      this.socket = io("http://localhost:5001"); //建立与flask ws的连接
      this.socket.on("connect", () => {
        console.log("Connected to WebSocket");
      }); //连接log下
      // 监听更新
      this.socket.on("device_list", (data) => {
        if (data && data.online_device) {
          console.log(data.online_device);
          this.online_dev = data.online_device;
        }
      });
      // 监听 WebSocket 错误
      this.socket.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      // 监听 WebSocket 断开连接
      this.socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
      });
    },

    // 关闭 WebSocket 连接
    closeWebSocket() {
      if (this.socket) {
        this.socket.disconnect();
        console.log("WebSocket disconnected");
      }
    },

    // 在组件销毁时关闭 WebSocket 连接
    beforeUnmount() {
      this.closeWebSocket();
    },
    //连接设备
    async connectToDevice(device_name, ip, port) {
      const res = await fetch(
        `http://127.0.0.1:3345/tolocalws?device_ip=${ip}&device_port=${port}&connect_status=open` //主动连接
      );
      const resDataOpen = await res.json();
      if (resDataOpen.LinkStatus == "connectok") {
        this.addDevicelist(device_name, ip, port);
      }
    },

    addDevicelist(device_name, device_ip, device_port) {
      this.isdevconnected = true;
      if (this.connecteddev.length == 0 && this.isdevconnected) {
        this.connecteddev.push({
          id: device_name,
          ip: device_ip,
          port: device_port,
          status_dev: true,
          opensyncpanel: false
        });
      } else {
        const existingDevice = this.connecteddev.find(
          (device) => device.id === device_name
        );

        if (existingDevice) {
          // 如果设备已经在列表中，更新其状态
          existingDevice.status_dev = true;
        } else {
          // 如果设备不在列表中，添加新设备
          this.connecteddev.push({
            id: device_name,
            ip: device_ip,
            port: device_port,
            status_dev: true,
            opensyncpanel: false
          });
        }
      }
      console.log(this.connecteddev);
    },
    removeDevice(index) {
      if (this.connecteddev[index]) {
        this.connecteddev[index].status_dev = false;
        this.connecteddev[index].opensyncpanel = false;
        // 检查是否所有设备都已断开连接
        if (this.connecteddev.every((device) => !device.status_dev)) {
          this.isdevconnected = false;
        }
      }
    },
    openDeviceSync(index) {
      

      // 创建新的面板实例
      const newPanel = {
        id: Date.now(), // 唯一标识符
        deviceId: this.connecteddev[index].id,
        deviceIp: this.connecteddev[index].ip,
        devicePort: this.connecteddev[index].port,
        position: {
          x: 100 + (this.panels.length * 30), // 错开放置
          y: 100 + (this.panels.length * 30)
        }
      };
      
      this.panels.push(newPanel);
      this.connecteddev[index].opensyncpanel = true;
      console.log(this.panels);
    },
    closeDeviceSync(panelId) {
      // 移除特定的面板
      this.panels = this.panels.filter(panel => panel.deviceId !== panelId);
      // 如果设备没有其他打开的面板，更新设备状态
      console.log(this.panels)
      const device = this.connecteddev.find((dev) => 
          (panelId === dev.id));
      
      if(device){
        device.opensyncpanel = false;
      }
      
    },
    startDrag(event, panelId) {
      if (!event.target.closest('.drag-handle')) return;
      
      const panel = this.panels.find(p => p.id === panelId);
      if (!panel) return;

      this.draggingPanelId = panelId;
      this.dragOffset = {
        x: event.clientX - panel.position.x,
        y: event.clientY - panel.position.y
      };

      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.stopDrag);
    },

    handleDrag(event) {
      if (!this.draggingPanelId) return;
      
      const panel = this.panels.find(p => p.id === this.draggingPanelId);
      if (panel) {
        panel.position = {
          x: event.clientX - this.dragOffset.x,
          y: event.clientY - this.dragOffset.y
        };
      }
    },

    stopDrag() {
      this.draggingPanelId = null;
      document.removeEventListener('mousemove', this.handleDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    }
  },

  // 组件销毁时清理事件监听器
  beforeUnmount() {
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  }
};
</script>


<template>
  <div v-if="this.isdevconnected && this.isServiceOpen" class="connected-device-container">
    <div class="device_list_name">
      <span style="color: lightgray">已经连接设备</span>
    </div>

    <TransitionGroup name="switch-fade" tag="ul" class="switch-list">
      <div
        v-for="(device, index) in connecteddev"
        :key="device.id"
      >
        <!-- 每个设备对应一个子组件 -->
        <div v-if="device.status_dev">
          <localconnector
            :device_name="device.id"
            :device_ip="device.ip"
            :device_port="device.port"
            :index="index"
            @close-device="removeDevice"
            @open-device="openDeviceSync"
          />
        </div>
        <div>
          <div v-for="panel in panels" 
               :key="panel.id"
               class="sync-panel" 
               :style="{ 
                 left: panel.position.x + 'px', 
                 top: panel.position.y + 'px' 
               }"
               @mousedown="(e) => startDrag(e, panel.id)">
            <div class="drag-handle"></div>
            <syncpanel
              :device_name="panel.deviceId"
              :device_ip="panel.deviceIp"
              :device_port="panel.devicePort"
              @close-sync="() => closeDeviceSync(panel.deviceId)"
            ></syncpanel>
          </div>
        </div>
      </div>
    </TransitionGroup>
   
  </div>

 
    <!-- 显示扫描到的 IP 地址 -->

    <div v-if="localIPs.length > 0" class="local-ip-find">
      <div>
        <span class="ip-header">发现本地IP：</span>
        <div v-for="(ip, index) in localIPs" :key="index" class="ip-item">
          {{ ip }}
        </div>
      </div>

      <!-- 输入框和连接按钮 -->
      <div class="query-section">
        <input
          v-model="selectedIP"
          @input="validateIP"
          :placeholder="'选择输入要开放的IP'"
          class="ip-input"
        />

        <input
          v-model="linkPort"
          :placeholder="'端口号'"
          @input="validatePort"
          class="port-input"
        />

        <button
          @click="serverOpen"
          :class="['connect-button', this.isServiceOpen ? 'off' : 'on']"
        >
          {{ isServiceOpen ? "服务开启成功,再次点击关闭" : "服务开启" }}
        </button>
        <!-- 错误提示 -->

        <div v-if="this.inputError" class="error-message">
          {{this.error }}
        </div>
      </div>

      <lk v-if="this.isServiceOpen" @lksuccess="addDevicelist"></lk>
      <div class="listener-section">
        <button
          v-if="this.isServiceOpen"
          @click="toggleListening"
          :class="['connect-button', this.isListening ? 'off' : 'on']"
        >
          {{ this.isListening ? "停止监听局域网服务" : "监听局域网服务" }}
        </button>

        <div v-if="isListening" class="device-list-section">
          <div v-if="online_dev.length > 0" class="device-list">
            <div
              v-for="(device, index) in online_dev"
              :key="index"
              class="device-item"
            >
              <!-- 信号状态 -->
              <div
                :class="['signal', device.device_name ? 'online' : 'offline']"
              ></div>
              <div class="device-info">
                <span class="-name">{{ device.device_name }}</span>
              </div>
              <button
                @click="
                  connectToDevice(
                    device.device_name,
                    device.device_ip,
                    device.device_nodeport
                  )
                "
                class="connect-button-small"
              >
                连接
              </button>
            </div>
          </div>
          <div v-else class="no-devices">当前没有在线设备</div>
        </div>
      </div>
    </div>
    
    <!-- 如果没有找到 IP -->
    <div v-else-if="localIPs.length <= 0" class="error-section">
      <ErrorSlot>未发现 IP,请检查服务是否开启</ErrorSlot>
      <button @click="scanLocalIPs" class="connect-button">重新获取</button>
    </div>

    <!-- 如果发生了其他错误 -->
 
    <!-- 监听按钮 -->
     




</template>

<style scoped>
.device_list_name {
  display: flex; /* 启用 flex 布局 */
  justify-content: center; /* 水平居中对齐 */
  align-items: flex-start; /* 垂直置顶对齐 */
  height: 15px; /* 父容器的高度 */
}
/* 通用样式 */


.sync-panel {
  position: fixed;
  background: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 520px;
  height: auto;
  
  max-width: 600px;
  z-index: 1000;
}

.drag-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: #e0e0e0;
  border-radius: 8px 8px 0 0;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.drag-handle::before {
  content: '⋮⋮';
  font-size: 20px;
  color: #666;
}

.drag-handle:hover {
  background: #d0d0d0;
}

.sync-panel syncpanel {
  margin-top: 20px;
  position: relative;
}

/* 防止文本被选中影响拖动体验 */
.sync-panel * {
  user-select: none;
}

.connected-device-container {
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 10px;
  background-color: #f7f7f7;
  height: 120%;
  width: 20%;
  right: 650px;
  flex-direction: column;
}
.connected-device {
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
  width: 300px; /* 设置新组件的宽度 */
}

.connect-button-small {
  border: none;

  padding: 5px 10px;
  font-size: 14px;
  background-color: #5ca371;
  border-radius: 5px;
}
.connect-button-small:hover {
  background-color: #4945a0;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}
.connect-button-small:focus {
  outline: none;
}
/* IP 地址发现部分样式 */
.local-ip-find {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: 800px;
  padding: 20px;
  border-radius: 10px;
  background-color: white;
  transition: transform 0.5s ease;
  position: absolute; /* 改为绝对定位 */
  left: 46%; /* 水平居中 */
  top: 50%; /* 垂直居中 */
  transform: translate(-50%, -50%); /* 完全居中 */
}

/* 当 isServiceOpen 为 true 时，移动到左侧 */
.local-ip-find.service-open {
  left: calc(50% - 280px); /* 使用 calc 计算左移位置 */
}

/* 输入框出错样式 */
.input-error {
  border-color: red;
}

.ip-header {
  font-size: 18px;
  color: #4caf50;
  margin-bottom: 10px;
}

.ip-item {
  font-size: 16px;
  color: #333;
  margin: 5px 0;
} /* 错误提示文本 */
.error-message {
  color: red;
  margin-top: 5px;
  font-size: 14px;
}

/* 输入框和连接按钮的排列 */
.query-section {
  display: flex;
  align-items: center;
  margin-top: 20px;
}
.port-input {
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
  width: 50px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.ip-input {
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
  width: 200px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.connect-button {
  padding: 12px 30px;
  font-size: 18px;
  color: white;
  background-color: #4caf50;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.connect-button:hover {
  background-color: #4945a0;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.connect-button:focus {
  outline: none;
}

/* 错误信息部分样式 */
.error-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
span {
  color: gray;
  font-size: 10px;
}
/* 监听按钮样式 */
.listener-section {
  margin-top: 20px;
}
.input-error {
  border-color: red;
}
/* 监听时的按钮样式 */
.on {
  background-color: #4caf50; /* 绿色 */
}

/* 不监听时的按钮样式 */
.off {
  background-color: #f44336; /* 红色 */
}
/* 信号部分样式 */
.signal {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
  background-color: gray;
  animation: pulse 1.5s infinite ease-in-out;
}

/* 在线状态 */
.signal.online {
  background-color: green;
}

/* 离线状态 */
.signal.offline {
  background-color: lightgray;
  animation: none; /* 离线时没有动画 */
}
.device-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.device-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.device-name {
  font-size: 16px;
  color: #333;
}

.no-devices {
  color: #777;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}
/* 呼吸动画 */
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(10px);
  }
}

.switch-fade-enter-active,
.switch-fade-leave-active {
  transition: opacity 0.5s, transform 0.5s ease-in-out;
}

.switch-fade-enter, .switch-fade-leave-to /* .switch-fade-leave-active in <2.1.8 */ {
  opacity: 0;
  transform: translateY(-10px);
}

.switch-fade-enter-to {
  animation: fade-in 0.5s forwards;
}

.switch-fade-leave-to {
  animation: fade-out 0.5s forwards;
}
</style>
