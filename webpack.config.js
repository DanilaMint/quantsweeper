const path = require('path');

module.exports = {
    entry: './web/main',
    output: {
        filename: 'app.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    experiments: {
        syncWebAssembly: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.wasm'],
        modules: [
            path.resolve(__dirname, 'pkg'),
            'node_modules'
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript']
                    }
                }
            },
            {
                test: /\.wasm$/,
                type: 'asset/inline'
            },
            {
                test: /\.svg$/,
                use: ['raw-loader'],
            },
        ]
    },
    optimization: {
        minimize: false
    },
    devtool: false
};