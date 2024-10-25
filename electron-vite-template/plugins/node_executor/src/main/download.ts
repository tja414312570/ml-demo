import { DownloaderHelper } from 'node-downloader-helper';
import path from 'path';
import fs from 'fs';

const downloadNode = async (url: string, version: string): Promise<string> => {
  const fileName = `node-${version}.tar.gz`; // 根据需要替换文件扩展名
  const downloadDir = path.join(__dirname, 'download');

  // 如果下载目录不存在，则创建它
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const filePath = path.join(downloadDir, fileName);
  const dl = new DownloaderHelper(url, downloadDir, {
    fileName: fileName,
    resumeIfFileExists: true, // 如果文件存在则继续下载
    override: false, // 默认不覆盖已有文件
  });

  dl.on('progress', (stats) => {
    console.log(`\r下载进度: ${stats.progress.toFixed(2)}%`);
  });

  dl.on('end', () => {
    console.log(`下载完成: ${filePath}`);
  });

  dl.on('error', (err) => {
    console.error(`下载出错: ${err.message}`);
  });

  try {
    await dl.start();
    return filePath;
  } catch (err) {
    throw new Error(`下载失败: ${(err as Error).message}`);
  }
};

export default downloadNode;
