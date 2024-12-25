import psutil
import ipaddress

def get_local_ipv6_addresses():
    ipv6_addresses = []

    # 获取所有网络接口的信息
    interfaces = psutil.net_if_addrs()

    # 遍历每个网络接口，查找 IPv6 地址
    for interface, addrs in interfaces.items():
        for addr in addrs:
            if addr.family == psutil.AF_INET6:
                ip = addr.address
                try:
                    ip_obj = ipaddress.IPv6Address(ip)
                    # 过滤出链路本地地址（fe80::/10）或全局地址
                    if ip_obj.is_link_local:
                        # 链路本地地址（局域网通信）
                        ipv6_addresses.append(ip)
                    elif ip_obj.is_global:
                        # 全局地址（可以用于跨路由通信）
                        ipv6_addresses.append(ip)
                except ValueError:
                    pass  # 过滤无效的IPv6地址
    return ipv6_addresses

# 获取本地所有IPv6地址
local_ipv6_addresses = get_local_ipv6_addresses()
print(local_ipv6_addresses)
