const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const archiver = require('archiver');
const glob = require('glob');

class ZipPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('ZipPlugin', (compilation) => {
      const outputDir = path.resolve(__dirname, 'dist');
      const buildDir = path.resolve(__dirname, 'build');
      const zipFile = path.join(buildDir, 'dist.zip');

      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
      }

      const output = fs.createWriteStream(zipFile);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        console.log(`${archive.pointer()} total bytes`);
        console.log('打包完成，zip 文件已生成在 build 目录下');
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn(err);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });
  }
}

module.exports = {
  entry: {
    // main 目录下的单一入口文件
    main: './src/main/index.ts',
    
    // render 目录下的所有文件为单独的入口文件
    ...glob.sync('./src/render/**/*.ts').reduce((entries, file) => {
      const entry = path.basename(file, path.extname(file));
      entries[`render/${entry}`] = file;
      return entries;
    }, {}),
  },
  target: 'node', // 确保为 node 环境编译
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
    filename: '[name].js', // 动态生成文件名，包含路径结构
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2', // 生成 CommonJS2 格式的输出
  },
  mode: 'production',
  optimization: {
    minimize: false, // 禁用代码压缩
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'assets', to: 'assets' },
      ],
    }),
    new ZipPlugin(),
  ],
};
