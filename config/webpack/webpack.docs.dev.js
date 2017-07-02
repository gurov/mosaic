const webpackMerge = require('webpack-merge');

const webpackMergeDll = webpackMerge.strategy({plugins: 'replace'});

const CleanWebpackPlugin = require('clean-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const DllBundlesPlugin = require('webpack-dll-bundles-plugin').DllBundlesPlugin;
const autoprefixer = require('autoprefixer');

const helpers = require('../helpers');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';
const HOST = 'localhost';
const PORT = 3003;
const METADATA = {
    host: HOST,
    port: PORT,
    ENV: ENV
};

module.exports = function (options) {

    return webpackMerge(commonConfig(options), {

        devtool: 'source-map',

        output: {
            path: helpers.root('dist-docs'),
            filename: '[name].bundle.js',
            sourceMapFilename: '[name].map',
            chunkFilename: '[id].chunk.js',
            library: 'ac_[name]',
            libraryTarget: 'var'
        },

        module: {
            rules: [

                {
                    test: /\.scss$/,
                    use: [
                        'raw-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true,
                                plugins: () => [
                                    require('autoprefixer')({
                                        browsers: ['last 2 versions']
                                    })
                                ]
                            }
                        },
                        'sass-loader?sourceMap'
                    ],
                    include: [ helpers.root('docs/app') ]
                },

                {
                    test: /\.scss$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                    include: [helpers.root('docs/styles')]
                },

                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'awesome-typescript-loader',
                            query: {
                                configFileName: 'tsconfig.docs.json'
                            },
                        },
                        'angular2-template-loader'
                    ],
                    exclude: [/\.e2e\.ts$/, /\.spec\.ts$/, /(node_modules)/]
                },
            ]
        },

        plugins: [

            new CleanWebpackPlugin(
                ['build-docs'],
                {
                    root: helpers.root(),
                    verbose: true,
                    dry: false
                }
            ),

            new HotModuleReplacementPlugin(),

            new DefinePlugin({
                'ENV': JSON.stringify(METADATA.ENV),
                'process.env': {
                    'ENV': JSON.stringify(METADATA.ENV),
                    'NODE_ENV': JSON.stringify(METADATA.ENV)
                }
            }),

            new DllBundlesPlugin({
                bundles: {
                    polyfills: [
                        "core-js",
                        {
                            "name": "zone.js",
                            "path": "zone.js/dist/zone.js"
                        },
                        {
                            "name": "zone.js",
                            "path": "zone.js/dist/long-stack-trace-zone.js"
                        }
                    ],
                    vendors: [
                        "@angular/animations",
                        "@angular/common",
                        "@angular/compiler",
                        "@angular/core",
                        "@angular/platform-browser",
                        "@angular/platform-browser-dynamic",
                        "@angular/router",
                        "rxjs"
                    ]
                },
                dllDir: helpers.root('dist-dll-docs'),
                webpackConfig: webpackMergeDll(commonConfig({env: ENV}),
                    {
                        devtool: 'source-map',
                        plugins: []
                    })
            }),

            new LoaderOptionsPlugin({
                debug: true,
                options: {
                    context: helpers.root('docs'),
                    tslint: {
                        emitErrors: true,
                        failOnHint: false,
                        resourcePath: helpers.root('docs')
                    }
                }
            }),

            new AddAssetHtmlPlugin([
                { filepath: `dist-dll-docs/${DllBundlesPlugin.resolveFile('polyfills')}` },
                { filepath: `dist-dll-docs/${DllBundlesPlugin.resolveFile('vendors')}` }
            ])
        ],

        devServer: {
            hot: true,
            inline: true,
            contentBase: './docs',
            port: METADATA.port,
            host: METADATA.host,
            historyApiFallback: true,
            watchOptions: {
                ignored: /node_modules/
            },
            stats: 'minimal'
        }
    })
};
