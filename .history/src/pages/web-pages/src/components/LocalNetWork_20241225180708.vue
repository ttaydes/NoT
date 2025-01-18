<script>
import ErrorSlot from "./../views/ErrorSlot.vue";
import io from "socket.io-client"; // 导入 socket.io-client
import localconnector from "./LocalConnector.vue";
import lk from "./LinkFrame.vue";

export default {
  components: {
    ErrorSlot,
    localconnector,
    lk,
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
    };
  },

  // 在组件挂载时自动触发获取 IP 地址
  async mounted() {
    await this.scanLocalIPs();
  },

  methods: {
    validateIP() {
      if (this.selectedIP.trim() === "" || this.inputError) {
        // 如果输入框为空，设置错误状态
        this.inputError = true;
        return;
      } else {
        this.inputError = false; // 输入框非空，清除错误状态
      }
    },
    validatePort() {
      var re = /^[A-Za-z]+$/; //
      var re_hanzi = /^[\u4e00-\u9fa5]*$/;
      //验证端口
      // 允许的端口范围是 0 到 65535
      const portNumber = Number(this.linkPort);
      // 限制输入为数字且不允许超出范围
      if (
        String(this.linkPort).match(re) ||
        String(this.linkPort).match(re_hanzi)
      ) {
        this.linkPort = "";
      }
      if (this.linkPort && (portNumber < 0 || portNumber > 65535)) {
        this.linkPort = this.linkPort.slice(0, -1); // 移除最后一个输入的字符
      }
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
      this.action = this.isServiceOpen ? "0" : "1";

      try {
        const response = await fetch(
          `http://127.0.0.1:5001/api/serv?ip=${this.selectedIP}&port=${this.linkPort}&isopen=${this.action}`
        ); //监听发布者服务打开/关闭

        const data = await response.json();

        if (data.status_id === 1) {
          this.isServiceOpen = true;
          this.setupEFws();
        } else if (data.status_id === 2) {
          this.isServiceOpen = false;
        } else {
          this.buttonText = "服务开启失败";
        }
      } catch (err) {
        this.buttonText = "开放服务";
        this.error = "获取局域网 IP 失败，请检查网络连接或重试。"; // 请求失败时显示的错误信息
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
            }
            if (this.connecteddev.every((device) => !device.status_dev)) {
              this.isdevconnected = false;
            }
          });
        }
      };
      this.socketefws.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
      });
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
    beforeDestroy() {
      this.closeWebSocket();
    },
    //连接设备
    async connectToDevice(device_name, ip, port) {
      const res = await fetch(`http://${ip}:${Number(port)}/`);
      if (res) {
        this.$emit("lksuccess", this.linkIp); // 向父组件发出 'lksuccess' 事件
        this.addDevicelist(device_name);

        this.linkIp = "";
        this.local_linkPort = 33451;
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
          });
        }
      }
    },
    removeDevice(index) {
      this.connecteddev[index].status_dev = false;

      if (this.connecteddev.every((device) => !device.status_dev)) {
        this.isdevconnected = false;
      }
    },
  },
};
</script>





<template>
  <div v-if="this.isdevconnected" class="connected-device-container">
    <div class="device_list_name">
      <span style="color: lightgray">已经连接设备</span>
    </div>

    <TransitionGroup name="switch-fade" tag="ul" class="switch-list">
      <div
        v-for="(device, index) in connecteddev.reverse()"
        :key="device.id"
        class="switch-item"
      >
        <!-- 每个设备对应一个子组件 -->
        <div v-if="device.status_dev">
          <localconnector
            :device_name="device.id"
            :device_ip="device.ip"
            :device_port="device.port"
            :index="index"
            @close-device="removeDevice(index)"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>

  <div class="container">
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
          :class="{ 'input-error': inputError }"
          class="ip-input"
        />

        <input
          v-model="linkPort"
          :placeholder="'端口号'"
          @input="validatePort"
          :class="{ 'input-error': inputError }"
          class="port-input"
        />

        <button
          @click="serverOpen"
          :class="['connect-button', this.isServiceOpen ? 'off' : 'on']"
        >
          {{ isServiceOpen ? "服务开启成功,再次点击关闭" : "服务开启" }}
        </button>
        <!-- 错误提示 -->

        <div v-if="inputError" class="error-message">
          未输入 IP 地址或端口格式输入错误
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
    <div v-else-if="this.error && isButtonClicked" class="error-section">
      <ErrorSlot>{{ this.error }}</ErrorSlot>
    </div>

    <!-- 监听按钮 -->
  </div>
</template>

<style scoped>
.device_list_name {
  display: flex; /* 启用 flex 布局 */
  justify-content: center; /* 水平居中对齐 */
  align-items: flex-start; /* 垂直置顶对齐 */
  height: 15px; /* 父容器的高度 */
}
/* 通用样式 */
.container {
  background-color: #f7f7f7;
  position: relative;
  cursor: pointer;
  display: flex;
  margin-left: 40px;
  left: -30px;
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-direction: column; /* 水平排列 */
}

.container.shift-left {
  transform: translateX(-300px); /* 偏移容器，调整数值可以更改偏移的距离 */
}

.connected-device-container {
  position: relative;
  margin-right: 20px; /* 给右侧组件留空隙 */
  flex-shrink: 0; /* 保证容器不收缩 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 10px;
  height: 78%;
  width: 30%;
  left: -20px;
  flex-direction: column; /* 水平排列 */
}
.device-func-container {
  position: relative;
  margin-right: 20px; /* 给右侧组件留空隙 */
  flex-shrink: 0; /* 保证容器不收缩 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 10px;
  height: 100%;
  width: 6.5%;
  left: 250px;
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
  width: 100%;
  max-width: 800px;
  padding: 20px;
  border-radius: 10px;
  background-color: white;
  transition: transform 0.5s ease; /* 添加过渡效果 */
}
.local-ip-find.
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
