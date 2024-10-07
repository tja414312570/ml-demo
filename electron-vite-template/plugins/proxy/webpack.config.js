const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const archiver = require('archiver');

class ZipPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('ZipPlugin', (compilation) => {
      const outputDir = path.resolve(__dirname, 'dist'); // dist 文件夹路径
      const buildDir = path.resolve(__dirname, 'build'); // build 文件夹路径
      const zipFile = path.join(buildDir, 'dist.zip'); // zip 包存放在 build 目录

      // 如果 build 目录不存在，则创建它
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
      }

      // 创建 zip 包的输出流
      const output = fs.createWriteStream(zipFile);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // 设置压缩级别
      });

      // 监听所有 archive 数据写入完成后触发
      output.on('close', () => {
        console.log(`${archive.pointer()} total bytes`);
        console.log('打包完成，zip 文件已生成在 build 目录下');
      });

      // 处理警告
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn(err);
        } else {
          throw err;
        }
      });

      // 处理错误
      archive.on('error', (err) => {
        throw err;
      });

      // 连接 archive 输出流
      archive.pipe(output);

      // 将 dist 文件夹中的所有文件追加到 zip 中
      archive.directory(outputDir, false);

      // 完成打包
      archive.finalize();
    });
  }
}

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 打包输出路径
  },
  mode: 'production',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' }, // 复制 manifest.json 到 dist
        { from: 'assets', to: 'assets' }, // 复制 assets 文件夹到 dist
      ],
    }),
    new ZipPlugin(), // 使用自定义 ZipPlugin 生成 zip 包
  ],
};
