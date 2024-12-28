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
      ws: null
    }
  },
  methods: {
    clearContent() {
      this.clipboardContent = '';
    },
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.clipboardContent);
        this.syncStatus = '已复制到剪切板';
        setTimeout(() => {
          this.syncStatus = this.isConnected ? '已连接' : '等待连接';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    handleInput() {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({
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

      this.ws.onmessage = (event) => {
        try {
          console.log(event.data);
          const data = JSON.parse(event.data);
          if (data.type === 'clipboard') {
            this.clipboardContent = data.content;
            this.copyToClipboard();
          }
        } catch (err) {
          console.error('Failed to process message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.syncStatus = '连接错误';
      };
    }
  },
  mounted() {
    this.initWebSocket();
  },
  beforeUnmount() {
    if (this.ws) {
      this.ws.close();
    }
  }
};
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