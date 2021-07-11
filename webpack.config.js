const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InlineChunkHtmlPlugin = require('inline-chunk-html-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

require('@babel/register')({ extensions: ['.ts'], cache: false });
const configs = require('./config');

module.exports = function config(env, options) {
	const isEnvProduction = options.mode === 'production';
	const isEnvDevelopment = options.mode === 'development';
	const isDevServer = isEnvDevelopment && process.argv.includes('serve');
	const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');
	const config = env.prod ? configs.prod : env.test ? configs.test : configs.local;

	process.env.BABEL_ENV = options.mode;
	process.env.BROWSERSLIST_ENV = options.mode;

	const babelOptions = {
		rootMode: 'upward',
		plugins: [['@babel/plugin-transform-runtime'], isDevServer && 'react-refresh/babel'].filter(Boolean),
		cacheDirectory: '.cache/babel-loader',
		cacheCompression: false,
		compact: false, // isEnvProduction,
		sourceType: 'unambiguous',
	};

	const appConfig = {
		name: 'app',
		mode: isEnvProduction ? 'production' : 'development',
		target: isDevServer ? 'web' : 'browserslist',
		bail: isEnvProduction,

		entry: './index',

		output: {
			path: path.resolve(__dirname, 'dist'),
			pathinfo: isEnvDevelopment,
			filename: isEnvProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/[name].js',
			chunkFilename: isEnvProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/[name].js',
			publicPath: '/',
			uniqueName: 'app',
		},

		devtool: isEnvProduction ? 'source-map' : 'cheap-module-source-map',

		optimization: {
			minimize: isEnvProduction,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						parse: { ecma: 8 },
						compress: {
							ecma: 5,
							warnings: false,
							comparisons: false,
							inline: 2,
						},
						mangle: { safari10: true },
						keep_classnames: isEnvProductionProfile,
						keep_fnames: isEnvProductionProfile,
						output: { ecma: 5, comments: false, ascii_only: true },
					},
				}),
			],
			splitChunks: {
				chunks: 'all',
				cacheGroups: {
					commons: {
						test: /[\\/].yarn[\\/]/,
						name: 'vendors',
						chunks: 'all',
					},
				},
			},
			runtimeChunk: {
				name: (entrypoint) => `runtime-${entrypoint.name}`,
			},
		},

		performance: {
			maxAssetSize: 650 * 1024,
			maxEntrypointSize: 650 * 1024,
		},

		resolve: {
			extensions: ['.wasm', '.mjs', '.js', '.ts', '.d.ts', '.tsx', '.json'],
			alias: {
				...(isEnvProductionProfile && {
					'react-dom$': 'react-dom/profiling',
					'scheduler/tracing': 'scheduler/tracing-profiling',
				}),
			},
		},

		module: {
			rules: [
				{
					test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
					loader: require.resolve('url-loader'),
					options: {
						limit: 10000,
						name: 'static/media/[name].[hash:8].[ext]',
					},
				},
				{
					test: /\.ts(x?)$/,
					include: path.resolve(__dirname),
					use: [
						{
							loader: 'babel-loader',
							options: babelOptions,
						},
						{
							loader: 'ts-loader',
						},
					],
				},
				{
					test: /\.(js|mjs)$/,
					include: path.resolve(__dirname),
					loader: 'babel-loader',
					options: babelOptions,
				},
			],
		},

		plugins: [
			new HtmlWebpackPlugin({
				inject: true,
				template: path.resolve(__dirname, 'public/index.html'),
				...(isEnvProduction && {
					minify: {
						removeComments: true,
						collapseWhitespace: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						removeStyleLinkTypeAttributes: true,
						keepClosingSlash: true,
						minifyJS: true,
						minifyCSS: true,
						minifyURLs: true,
					},
				}),
			}),
			isEnvProduction && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
			!isDevServer &&
				new CopyWebpackPlugin({
					patterns: [
						{
							from: './public',
							filter: (filename) => filename !== path.resolve(__dirname, 'public/index.html'),
						},
					],
				}),
			new webpack.DefinePlugin({
				'process.env.APP_NAME': JSON.stringify('React App'),
				'process.env.APP_ORIGIN': JSON.stringify('http://localhost:3000'),
			}),
			isDevServer && new webpack.HotModuleReplacementPlugin(),
			isDevServer && new ReactRefreshWebpackPlugin(),
			new BundleAnalyzerPlugin({
				analyzerMode: 'static',
				reportFilename: 'bundle-report.html',
				openAnalyzer: false,
				generateStatsFile: false,
				statsFilename: 'bundle-stats.json',
			}),
			new WebpackManifestPlugin({ fileName: 'assets.json', publicPath: '/' }),
			new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		].filter(Boolean),
	};

	const devServer = {
		contentBase: './public',
		compress: true,
		historyApiFallback: { disableDotRule: true },
		port: 3000,
		hot: true,
		proxy: [
			{
				context: [config.api.path, '/auth'],
				target: config.api.origin,
				changeOrigin: true,
				pathRewrite: config.api.prefix ? { '^/': `${config.api.prefix}/` } : {},
				onProxyReq(proxyReq, req) {
					const origin = `${req.protocol}://${req.hostname}:3000`;
					proxyReq.setHeader('origin', origin);
				},
			},
		],
	};

	return isDevServer ? { ...appConfig, devServer } : [appConfig];
};
