const presets = ['@babel/preset-react']

const plugins = [
  [
    './dist/index.js',
    {
      "Button": {
        "size": "small"
      }
    }
  ]
]
module.exports = { presets, plugins }
