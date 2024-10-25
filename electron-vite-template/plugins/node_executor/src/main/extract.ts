import fs from 'fs';
import path from 'path';
import { extractFull } from 'node-7z'; // Importing the extract function

// Function to determine output directory based on file path
const getOutputDir = (filePath: string): string => {
  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);
  return path.join(dirName, baseName);
};
const moveSingleSubdirectoryUp = (outputDir: string) => {
  // 读取 outputDir 的内容
  const items = fs.readdirSync(outputDir);

  // 检查是否只有一个子目录
  if (items.length === 1) {
    const singleSubDir = path.join(outputDir, items[0]);
    
    // 检查是否是一个目录
    if (fs.statSync(singleSubDir).isDirectory()) {
      // 获取子目录中的所有内容
      const subDirContents = fs.readdirSync(singleSubDir);

      // 将子目录中的所有内容移动到 outputDir
      subDirContents.forEach((item) => {
        const oldPath = path.join(singleSubDir, item);
        const newPath = path.join(outputDir, item);
        fs.renameSync(oldPath, newPath);
      });
      // 删除空的单一子目录
      fs.rmdirSync(singleSubDir);
    }
  }
  return outputDir;
};

const extractNode = (filePath: string,saveDir?:string) => {
  return new Promise<string>((resolve, reject) => {
    const outputDir = saveDir || getOutputDir(filePath);
    // If output directory exists, remove it first
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    // Check if output directory needs to be created
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // Use node-7z to extract the file
    const extraction = extractFull(filePath, outputDir, {
      $bin: require('7zip-bin').path7za, // 7-zip binary path (default included with 7zip-bin)
      recursive: true, // Enable recursive extraction
      $progress: true
    });

    extraction.on('progress', (progressData: { percent: number; }) => {
      // Calculate and display extraction progress
      process.stdout.write(`\r解压进度: ${progressData.percent.toFixed(2)}%`);
    });

    extraction.on('end', () => {
      console.log('正在优化解压内容');
      const dir = moveSingleSubdirectoryUp(outputDir);
      resolve(dir);
      console.log('解压完成');
    });

    extraction.on('error', (err: any) => {
      reject(err);
    });
  });
};

export { extractNode };
