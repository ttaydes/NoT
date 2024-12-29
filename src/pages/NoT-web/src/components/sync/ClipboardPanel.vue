<template>
  <div class="clipboard-panel">
    <div class="clipboard-area">
      <textarea 
        v-model="clipboardContent"
        @input="handleInput"
        placeholder="在此输入或粘贴内容..."
      ></textarea>
    </div>
    <div class="sync-status">
      {{ syncStatus }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    device_name: String,
    device_ip: String,
    device_port: String
  },

  data() {
    return {
      clipboardContent: '',
      syncStatus: '等待连接...',
      isConnected: false,
      ws: null,
      clipboardsocketefws: null
    }
  },

  methods: {
    clearContent() {
      this.clipboardContent = '';
    },

    async copyToClipboard() {
      try {
        // 首先尝试使用现代 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(this.clipboardContent);
        } else {
          // 后备方案：使用传统的 execCommand 方法
          const textArea = document.createElement('textarea');
          textArea.value = this.clipboardContent;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            textArea.remove();
          } catch (err) {
            console.error('Fallback copy failed:', err);
            textArea.remove();
            throw new Error('Copy operation failed');
          }
        }

        this.syncStatus = '已复制到剪切板';
        setTimeout(() => {
          this.syncStatus = this.isConnected ? '已连接' : '等待连接';
        }, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
        this.syncStatus = '复制失败';
        setTimeout(() => {
          this.syncStatus = this.isConnected ? '已连接' : '等待连接';
        }, 2000);
      }
    },

    handleInput() {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({
          reqlinkname: this.device_name,
          reqlinkip: this.device_ip,
          reqlinkport: this.device_port,
          type: 'clipboard',
          content: this.clipboardContent
        }));
      }
    },

    initWebSocket() {
      const wsUrl = `ws://${this.device_ip}:${this.device_port}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.syncStatus = '已连接';
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.syncStatus = '连接已断开';
        setTimeout(() => this.initWebSocket(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.syncStatus = '连接错误';
      };
    },

    clipboardsetupEFws() {
      this.clipboardsocketefws = new WebSocket("ws://127.0.0.1:33456?userId=clipboardws");

      this.clipboardsocketefws.onopen = () => {
        console.log("Connected to backend WebSocket");
      };

      this.clipboardsocketefws.onmessage = (event) => {
        const fromlocaldevdata = event.data.toString();
        // 解析外层的 JSON
        const outerData = JSON.parse(fromlocaldevdata);
        // 解析内层的 JSON 字符串
        const data = JSON.parse(outerData.fromlocaldev);
        const reqlinktype = data.type;
        const clipboarddata = data.content;
        console.log(clipboarddata);
        if (reqlinktype === "clipboard") {
          this.clipboardContent = clipboarddata;
          this.copyToClipboard();
        }
      };
    }
  },

  mounted() {
    this.initWebSocket();
    this.clipboardsetupEFws();
  },

  beforeUnmount() {
    console.log("beforeUnmount");
    if (this.ws) {
      this.ws.close();
    }
    if (this.clipboardsocketefws) {
      this.clipboardsocketefws.close();
    }
  }
}
</script>

<style scoped>
.clipboard-panel {
  padding: 10px;
}

.clipboard-area textarea {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
}

.sync-status {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}
</style> 