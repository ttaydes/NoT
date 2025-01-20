# NoT

>  该project目的是提高coding中的不同设备平台间数据流传输效率。
>
> 后续会更新更多功能



## NoT-Web

###### __所用技术栈__

- node.js（express）
- Python flask 
- Vue 3

###### __支持平台__

- windows&linux&mac  的 webpage

###### __build environment__

- python3^ & flask:latest
- node lts(v22.13.0) & Express:latest
- Vue3:latest

   项目下安装python库依赖

 ```py
 pip install -r requirements.txt
 ```

   package.json 库依赖安装，所在目录下

   ```
   npm install
   ```



是目前所实现的一个demo,为**桌面端**&**插件**实现提供kernel

当前具有**文件传输**和**剪切板同步**的功能

项目主要实现了：
- __局域网设备发现__
- __连接设备管理__
- __剪切板同步与文件传输控制__（超过10GB大小以上未测试，预计没问题）

## Update

- publish Not-web beta1.0———20250118 



## Preview

> 将基于Electron对桌面端与移动端的实现; 开发IP模块预计功能有vps中转同步数据流,vps-for-web管理...

