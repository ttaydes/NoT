<template>
  <div class="file-transfer-panel">
    <!-- 文件传输列表 -->
    <div class="transfer-list">
      <div class="list-header">
        <h4>传输列表</h4>
        <div class="list-tabs">
          <button 
            @click="activeList = 'sending'"
            :class="['list-tab', { active: activeList === 'sending' }]"
          >
            发送
          </button>
          <button 
            @click="activeList = 'receiving'"
            :class="['list-tab', { active: activeList === 'receiving' }]"
          >
            接收
          </button>
        </div>
      </div>
      
      <!-- 发送列表 -->
      <div v-if="activeList === 'sending'" class="transfer-items">
        <div v-for="file in sendingFiles" :key="file.id" class="transfer-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress" 
              :style="{ width: file.progress + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ file.progress }}%</span>
        </div>
      </div>

      <!-- 接收列表 -->
      <div v-else class="transfer-items">
        <div v-for="file in receivingFiles" :key="file.id" class="transfer-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress" 
              :style="{ width: file.progress + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ file.progress }}%</span>
        </div>
      </div>
    </div>

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
      >
      <div class="upload-content">
        <i class="upload-icon">📁</i>
        <p>拖拽文件到此处或</p>
        <button @click="$refs.fileInput.click()" class="upload-btn">
          选择文件
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>
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
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
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
  background: #4CAF50;
  color: white;
}

.transfer-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.file-info {
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

.progress-bar {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-area.dragging {
  border-color: #4CAF50;
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
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background: #45a049;
}
</style> 