const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/bot.ts',
    output: {
        filename: 'bot.ts',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'node12.18',
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'package.json') },
            ],
        }),
    ]
};
