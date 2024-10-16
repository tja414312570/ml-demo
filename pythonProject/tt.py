import platform
import sys

# 获取操作系统信息
os_info = platform.platform()
# 获取Python版本信息
python_version = sys.version

env_info = {
    "操作系统": os_info,
    "Python版本": python_version
}
env_info
