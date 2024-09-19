import requests
import urllib
from PIL import Image
from easyofd.ofd import OFD
import base64


def ofd_to_images(ofd_path, images_path, filename):
    with open(ofd_path + filename, "rb") as f:
        ofdb64 = str(base64.b64encode(f.read()), "utf-8")
        ofd = OFD()  # 初始化OFD 工具类
        ofd.read(ofdb64, save_xml=False, xml_name="testxml")  # 读取ofdb64
        # print(ofd.data) # ofd.data 为程序解析结果
        img_np = ofd.to_jpg()  # 转图片

        for idx, img in enumerate(img_np):
            im = Image.fromarray(img)
            im.save(f'%s.png' % (images_path + filename[:-4],))


def ofd_to_pdf(ofd_path, images_path, filename):
    with open(ofd_path + filename, "rb") as f:
        ofdb64 = str(base64.b64encode(f.read()), "utf-8")
        ofd = OFD()  # 初始化OFD 工具类
        ofd.read(ofdb64, save_xml=False, xml_name="testxml")  # 读取ofdb64
        # print(ofd.data) # ofd.data 为程序解析结果
        pdf_bytes = ofd.to_pdf()  # 转pdf

        with open(f'%s.pdf' % (images_path + filename[:-4],), "wb") as f:
            f.write(pdf_bytes)


if __name__ == "__main__":
    # 将ofd转成pdf
    ofd_to_images("C:\\Users\\tja41\\Desktop\\it条线制度\\风险管理\\",
               "C:\\Users\\tja41\\Desktop\\it条线制度\\风险管理\\",
               "贵阳农商银行关于印发业务连续性管理办法（修订）的通知.ofd")
    # 将ofd转成images
    # ofd_to_images(ofd_file_folder, img_file_folder, filename)