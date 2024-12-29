<script>
export default {
  data() {
    return {
      linkPort: 33451,
      linkIp: "",
      inputError: false, // 用于标记输入框是否出错
    };
  },
  methods: {
    validatePort() {
      //验证端口
      // 允许的端口范围是 0 到 65535
      const portNumber = Number(this.linkPort);
      if (portNumber >= 0 && portNumber <= 65535) {
        this.inputError = false;
      } else {
        this.inputError = true;
      }
    },
    async connectTOlocalDevice() {
      const res = await fetch(
        `http://127.0.0.1:3345/tolocalws?device_ip=${this.linkIp}&device_port=${this.linkPort}&connect_status=open` //主动连接
      );
      const resDataOpen = await res.json();
      if (resDataOpen.LinkStatus == "connectok") {
        this.$emit("lksuccess", this.linkIp, this.linkIp, this.linkPort); // 向父组件发出 'lksuccess' 事件
        this.linkIp = "";
        this.inkPort = 33451;
      }
    },
  },
};
</script>




<template>
  <div class="link-frame">
    <div style="flex-direction: column">
      <div>
        <span style="color: grey">若已知局域网IP直接连接</span>
      </div>

      <input
        v-model="linkIp"
        :placeholder="'输入IP'"
        :class="{ 'input-error': inputError }"
        class="ip-input"
      />
      <input
        v-model="linkPort"
        @input="validatePort"
        :placeholder="'端口号'"
        :class="{ 'input-error': inputError }"
        class="port-input"
      />
      <button
        @click="connectTOlocalDevice"
        :class="['connect-button', this.isServiceOpen ? 'off' : 'on']"
      >
        连接
      </button>
    </div>
  </div>
</template>

<style scoped>
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

.ip-input {
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
  width: 200px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.link-frame {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 90%;
  height: 200%;
  max-width: 800px;
  padding: 20px;
  background-color: white;
}

.connect-button:hover {
  background-color: #4945a0;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.connect-button:focus {
  outline: none;
}
/* 通用样式 */

.port-input {
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
  width: 50px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
</style>
