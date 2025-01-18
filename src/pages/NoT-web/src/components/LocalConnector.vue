<template>
  <div class="device-frame">
    <button class="button-devicename" @click="openDevice">{{ device_name }}</button>
    <button class="closebutton-devicename" @click="closeDevice">断开</button>
  </div>
</template>

<script>
export default {
  props: {
    device_name: String,
    index: Number,
    device_ip: String,
    device_port: String,
  },
  methods: {
    async closeDevice() {
      try{
        const res = await fetch(
        `http://127.0.0.1:3345/tolocalws?device_ip=${this.device_ip}&device_port=${this.device_port}&connect_status=close`);
        const resDataclose = await res.json();

        if (resDataclose.LinkStatus == "closeok") {
          this.$emit("close-device", this.index); // 向父组件发出 'close-device' 事件
      }
      }catch(error){
        this.$emit("close-device", this.index); // 向父组件发出 'close-device' 事件

      }
      
    },
    openDevice() {
      this.$emit("open-device", this.index); // 向父组件发出 'open-device' 事件
    },
  },
};
</script>

<style scoped>
.device-frame {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 115%;
  height: 5%;
  position: relative;
  background-color: rgb(244, 241, 237);
  box-shadow: 0 4px 8px rgba(6, 6, 6, 0.1);
  border-radius: 10px;
  padding: 10px;
  left: -50px;
}

.button-devicename {
  position: relative;
  padding: 10px 20px;
  background-color: #e2e2e2d4;
  font-size: 100%;
  color: rgb(83, 214, 60);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 45px;
  width: 130%;
}

.closebutton-devicename {
  padding: 10px 20px;
  background-color: rgb(230, 224, 224);
  color: rgb(228, 9, 9);
  border: none;
  transition: all 0.3s ease;
  flex-direction: row;
  border-radius: 17px;
  cursor: pointer;
  height: 45px;
  width: 40%;
}

button:hover {
  background-color: #d1d1d1;
}

.close-switch {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 10px;
}
</style>
