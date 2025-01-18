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
- node lts(v22.13.0) & express latest
- Vue3 latest

   项目下安装python库依赖

 ```py
 pip instal -r requirements.txt
 ```

   package.json 库依赖安装，所在目录下

   ```
   npm install
   ```
  当安装完所有依赖后 在bin下 python main.py 或者
  直接运行notrun的二进制文件
  在终端运行启动后，直接访问
   ```
   127.0.0.1:5001
   ```


是目前所实现的一个demo,为__桌面端__&__插件__实现提供kernel

当前具有__文件传输__和__剪切板同步__的功能

项目主要实现了：

- __局域网设备监听服务__
- __连接设备管理__
- __文件传输控制__（超过10GB大小以上未测试，预计没问题）

## Update

- publish Not-web beta1.0———20250118 



## Preview

> 将基于Electron对桌面端的实现

