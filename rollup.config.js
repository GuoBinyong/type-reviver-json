import {removeScope,getBaseNameOfHumpFormat,getDependencieNames} from "package-tls";
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';


// 配置 ---------------------------------


/*
注意：
- rollup 默认翻用的不是 node 的模块解析算法，所以，rollup 找不到由 npm 安装的依赖（模块），所以 由 npm 安装的依赖也不被被要想构建进最终的输出包中；这样也起到了排除 node_modules 中模块的效果；排除模块的功能 由 external 选项指定
- @rollup/plugin-node-resolve 插件可让 rollup 用 node 的模块解析算法来查找模块；
*/

/*
共用的配置
*/

// 共用的 rollup 配置
const shareConf = {
	input: 'src/index.ts',
	external: getDependencieNames(pkg),  //移除 package.json 中所有的依赖包
	plugins: [
		// 使用node解析算法查找模块
		resolve({
			/*
			browser   类型: Boolean   默认值: false
			是否优先使用 `package.json` 中的 browser 字段来解析依赖包的入口文件；
			- 构建专门用于浏览器环境的包时，建义设置为 `browser:true`；
			- 构建专门用于node环境的包时，建义设置为 `browser:false` 或者 删除此选项；
			*/
			browser:true,
			/*
			extensions   类型: Array[...String]    默认值: ['.mjs', '.js', '.json', '.node']
			扩展文件名
			*/
			extensions:['.ts', '.mjs', '.js', '.json', '.node']
		}),
		commonjs(), // 将依赖的模块从 CommonJS 模块规范转换成 ES2015 模块规范
		typescript() // 将 TypeScript 转换为 JavaScript
	]
};



// 导出的 rollup 配置
export default [
	/*
	模块友好的构建
	特点：
	   - 仅只能以 js模块 的方式被引入
	   - 移除了 node_modules 中的所有依赖
	*/
	{
		...shareConf,
		output: [
			{ file: pkg.module || `dist/${removeScope(pkg.name)}.esm.js`, format: 'es' },  // ES module
			{ file: pkg.main || `dist/${removeScope(pkg.name)}.cjs.js`, format: 'cjs' }, // CommonJS
		]
	},


	/*
	兼容各种引入方式的构建
	特点：
	   - 可用 <script> 标签直接引入
	   - 也可用 AMD、CommonJS 的模块化方案引入；
	   - 将所有依赖都构建在了一起
	*/
	{
		...shareConf,
        external:getDependencieNames(pkg,"peerDependencies"),   //只移除 peerDependencies 中的依赖
		output: {
			// 如果 pkg.browser 是字符串类型，则 file 为 pkg.browser，否则为 `<包名>.umd.js`
			file: typeof pkg.browser === "string" ? pkg.browser : `dist/${removeScope(pkg.name)}.umd.js`,
			format: 'umd',
			name: getBaseNameOfHumpFormat(pkg.name)  //驼峰格式的 pkg.name
		}  // umd
	}
];