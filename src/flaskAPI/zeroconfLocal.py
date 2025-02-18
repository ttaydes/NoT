from zeroconf import Zeroconf, ServiceInfo,ServiceBrowser
import logging
import socket
#register a zeroconf instance

# 定义监听器    
class MyListener:
    
    def __init__(self):
        self.local_online_device = []
    
    def remove_service(self, zeroconf, type, name):
        # 设备下线时触发
        logging.info(f"Service {name} removed") 
        info = zeroconf.get_service_info(type, name)
        device_names = [device['device_name'] for device in self.local_online_device]
        dev_name = name.split('.')[0]

        if dev_name in device_names:
            b = [device for device in self.local_online_device if device['device_name'] != dev_name]

            self.local_online_device = b
                # 从在线设备列表中移除  

    def add_service(self, zeroconf, type, name):
      
        
        
        logging.warning(f"Service {name} added")
            # self.local_online_device.append(name.split('.')[0])  # 获取设备的名称
        info = zeroconf.get_service_info(type, name)
        print(info)

        dev_name = name.split('.')[0]
        nd = 'node_port'.encode()
        local_node_port_encoded = info.properties[nd]
        local_node_port = local_node_port_encoded.decode()

        s = info.addresses[0]

        decimal_values = list(s)
        ip_address = '.'.join(map(str, decimal_values))
        dev_info = {"device_name":dev_name,"device_ip":ip_address,"device_nodeport":local_node_port}
        if dev_info not in self.local_online_device and  dev_name != '_' + socket.gethostname():
            self.local_online_device.append(dev_info)
  
    def update_service(self, zeroconf, type, name):
        # 设备更新时触发（例如服务状态变化）
        logging.warning(f"Service {name} updated {self.local_online_device}")

        
zeroconf = Zeroconf()
listener = MyListener()
browser = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)

# 启动 Zeroconf 服务
def start_service(info):
    try:
        zeroconf.register_service(info)
        
        logging.info("Service started:", info)
    except Exception as e:
        logging.ERROR(f"Error starting service: {e}")

# 停止 Zeroconf 服务
def stop_service(info):
    try:
        zeroconf.unregister_service(info)
        logging.info("Service stopped:", info)
    
    except Exception as e:
        logging.ERROR(f"Error stopping service: {e}")


