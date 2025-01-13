<template>
  <div class="file-transfer-panel">
    <!-- 文件传输列表 -->
    <div class="transfer-list">
      <div v-if="receviefiles.length > 0">

        
      </div>
      <div v-else class="empty-item">
        暂未接收到文件
      </div>
    </div>
    <div class="transfer-list">
      <div v-if="sendfiles.length" >
        <div v-for="(file, index) in sendfiles" :key="index" class="transfer-item">
          
          <div class="progress-bar" :style="{ width: this.fileprogress[file.file.name] + '%' }"></div>


        
    
          <div class="file-info">
            <div class="file-name">
              {{ file.file.name }}
            </div>
            <div class="file-size">{{ formatFileSize(file.file.size) }}</div>
          </div>
        
          <button
            @click="removeFile(index)"
            class="remove-btn"
            title="删除文件"
          >
            ✖
          </button>
          <div class="status-container">
            <span v-if="file.status === 'success'" class="status success">发送成功</span>
            <span v-else-if="file.status === 'error'" class="status error">发送失败</span>
          </div>
         
        </div>
      </div>
      <div v-else class="empty-item">暂无待发送文件</div>
    </div>
    <button
      v-if="sendfiles.length"
      @click="sendMultiMultipleFiles"
      class="send-btn"
    >
      发送文件 ({{ sendfiles.length }})
    </button>

    <!-- 文件上传区域 -->
    <div
      class="upload-area"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      :class="{ dragging: isDragging }"
    >
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        multiple
        style="display: none"
      />
      <div class="upload-content">
        <i class="upload-icon">📁</i>
        <p>拖拽文件到此处或</p>
        <button @click="fileInputClick" class="upload-btn">
          选择文件
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FileTransferPanel",
  props: {
    device_name: String,
    device_ip: String,
    device_port: String
  },
  data() {
    return {
      fileprogress: {},
      sendfiles: [],
      receviefiles: [],
      isDragging: false,
      isConnected: false,
      ws: null,

    };
  },
  mounted(){
      this.initWebSocket()
    },
  methods: {
    
    initWebSocket(){

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

    handleFileSelect(event) {
      const selectedFiles = Array.from(event.target.files);
      this.addFiles(selectedFiles);
      this.$refs.fileInput.value = ""; // 清空输入框
    },
    handleDrop(event) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      this.addFiles(droppedFiles);
      this.isDragging = false;
    },
    handleDragOver() {
      this.isDragging = true;
    },
    handleDragLeave() {
      this.isDragging = false;
    },
    addFiles(newFiles) {
      newFiles.forEach((file) => {
        if (!this.sendfiles.some((f) => f.name === file.name)) {
          this.sendfiles.push({
            file: file,
            progress: 0, // 初始进度
            status: "pending", // 初始状态
          });
        }
      });
    },
    removeFile(index) {
      this.sendfiles.splice(index, 1);
    },
    formatFileSize(size) {
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    },
    
    splitFile(file,chunckSize){
      const chunks = [];
      let offset = 0;
      while(offset < file.size){
        chunks.push(file.slice(offset,offset+ chunckSize));
        offset += chunckSize;
      }

      return chunks;
    },
    async sendFileChunks(file,ws){
      
      const chunksize = 8 * 1024; // chunk size 
      const eachfilechunks = this.splitFile(file,chunksize);

      const totalChunks = eachfilechunks.length;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = eachfilechunks[i];
        const metadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filelastModifiedDate: file.lastModified,
          chunkNum: totalChunks,
          currentChunk: i,
        };

        // chunkdata 为chunk的字符串形式
        const chunkBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]); // 提取 Base64 内容
          reader.onerror = () => reject(new Error("Blob 转换失败"));
          reader.readAsDataURL(chunk);
        });        
        ws.send(JSON.stringify({ type: 'transfile', metadata: metadata,chunks: chunkBase64 }));
    
      
        await new Promise((resolve) => {
          ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.type === 'ack' && response.chunk == i + 1) {

              file.progress = Math.round(((i + 1) / totalChunks) * 100);
              this.fileprogress[file.name] = file.progress;
              resolve();
            }
        };
      }); // 确认接收后 再次发送下一个块
      }
      file.status = "success"; 
    },
    async sendMultiMultipleFiles(){
      
      console.log("发送以下文件:", this.sendfiles);
      for (const fileobj of this.sendfiles) {
        try {
          await this.sendFileChunks(fileobj.file, this.ws);
        } catch (error) {
        fileobj.status = "error"; // 传输失败
        console.error("文件传输失败:", error);
        }
      }
    },
    fileInputClick() {
      this.$refs.fileInput.click();
    },
  },
};
</script>

<style scoped>
.empty-item {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
.file-transfer-panel {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 20px;
  height: 100%;
}

.transfer-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  max-height: 200px; /* 限制高度 */
  overflow-y: auto; /* 添加滚动 */
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1px;
}

.list-tabs {
  display: flex;
  gap: 10px;
}

.list-tab {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #f0f0f0;
}

.list-tab.active {
  background: #4caf50;
  color: white;
}

.transfer-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
  overflow: hidden; /* 防止进度条溢出 */
  background: #fff;
}

.file-info {
  position: relative;
  z-index: 2; /* 内容层在进度条之上 */
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: bold;
}

.file-size {
  color: #666;
  font-size: 12px;
}
.remove-btn {
  position: absolute;
  z-index: 2; /* 删除按钮也在进度条之上 */
  background: none;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
  right: 10px;
  font-size: 16px;
}
.send-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.send-btn:hover {
  background: #45a049;
}
.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-area.dragging {
  border-color: #4caf50;
  background: #f0f7f0;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 40px;
}

.upload-btn {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background: #45a049;
}

.progress-bar {
  position: absolute; /* 覆盖父容器 */
  top: 0;
  left: 0;
  height: 100%; /* 高度占满整个父容器 */
  background: rgba(76, 175, 80, 0.4); /* 半透明绿色 */
  transition: width 0.3s; /* 添加平滑动画 */
  z-index: 1; /* 保证进度条在文字后面 */
}

.status-container {
  position: relative;
  z-index: 2; /* 状态信息在进度条之上 */
  margin-left: 10px;
}

.status {
  display: inline-block;
  margin-left: 10px;
  font-size: 12px;
  color: #666;
}

.status.success {
  color: #4caf50;
}

.status.error {
  color: #ff4d4d;
}

</style>
