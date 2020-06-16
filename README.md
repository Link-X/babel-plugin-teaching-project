### 开发一个Babel插件
> 本文是VsCode编辑器为教程，如果你的编辑器不是VsCode那么本文的调试方法你将无法使用。最后推荐一下巨硬公司的VsCode，强大。  

** 一、这个插件的作用是什么？ **  
* 这是一个自动给React组件添加属性的插件。  

** 二、我们要是实现的效果? **   
* 1、能够给React组件添加属性
* 2、能够使用VsCode断点调试代码
* 3、能够使用快捷命令自动打包ts  

注意：babel-project/index.ts里的代码并不是我写的，它是[babel-plugin-react-auto-props](https://github.com/clumsyme/babel-plugin-react-auto-props)的代码。本文的目的是希望能够通过这个插件教大家如何使用VSCode开发和调试，打开Babel插件开发的敲门砖~~其实是作者对Babel插件开发不熟悉~~  
那么我们开始吧。  
整个项目目录结构:  
```javascript
 .vscode 
   --launch.json // vscode 调试配置文件
   --task.json // 自动打包配置
 babel-project
   --index.ts // 项目代码
 dist // 项目打包后的文件
   --index.js
   --index.js.map
 lib // 我们的插件转换后的代码
   --index.js
 node_modules
 test // 测试目录
   --index.js
 babel.config.js // babel配置文件
 package.json
 package-lock.json
 tsconfig.json // ts配置文件
```
需要用到的包（有的包并没有用到，权当了解吧）：  
* `@babel/cli`
* `@babel/preset-react`
* `@babel/core` 
* `@babel/generator`
* `@babel/template`
* `@babel/traverse`
* `@babel/traverse`
* `@babel/traverse`
* `@babel/types`
* `babylon`
* `@babel/preset-env`
#### 第一步（创建目录）
* 首先新建一个目录 `npm init`,init完后在这个目录下新建这几个子目录  
```javascript
 .vscode
   --launch.json
   --task.json
 babel-project
   --index.ts
 test
   --index.js
```  
* 然后npm i * * -D 上面上个包
#### 第二部（配置文件）
> tsconfig.json  

我们需要配置一些typescript，加上入口（`rootDir`)、出口`outDir`、以及需要将什么模块(`target`)的代码打包到什么模块(`module`)类型等等
```javascript
{
  "compilerOptions": {
      "baseUrl": ".",
      "paths": { "*": ["types/*"] },
      "module": "commonjs",
      "target": "es6",
      "outDir": "./dist",
      "lib": ["es6", "dom"],
      "sourceMap": true,
      "rootDir": "babel-project"
  },
  "include": [
    "babel-project/**/*"
  ],
  "exclude": ["node_modules"]
}
```
> .vscode/launch.json

这个是VsCode 的配置文件，我们将`program`参数指向babel-cli的index.js 然后加上参数设置入口、出口

```javascript
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "sourceMaps": true,
      "program": "${workspaceFolder}/node_modules/@babel/cli/lib/babel/index.js",
      "args": [
        "test/index.js",
        "-o",
        "lib/index.js"
      ]
    }
  ]
}
```

> .vscode/task.json

这个是VsCode的构建命令配置文件。配置了这个我们就可以利用快捷键打包我们的项目代码了

```javascript
{
  "version": "0.1.0",
  "command": "tsc",
  "isShellCommand": true,
  "args": ["-p", ".", "-w"],
  "showOutput": "always",
  "problemMatcher": "$tsc"
}
```

> babel.config.js

这个是我们插件配置文件。将来如果有人用这个插件，这就是他们要配置的东西 ~~用来做什么？~~

```javascript
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

```

> package.json 

项目的依赖文件配置，这个不用多说了把
```
  .....
  "scripts": {
    "build": "tsc"
  },
  .....
```

> 测试代码

这个是我们用来测试插件的代码，到时候会将这个代码打包成我们想要的样子
```javascript
let b = <PPP>1234</PPP>
let element = <Button color="red"  />
```

> babel-project/index.ts  


本体来了~ 这个就是我们插件的全部代码。
```javascript
// import * as babelCore from '@babel/core'
import * as parser from '@babel/parser'
import * as types from '@babel/types'
import traverse, { NodePath } from '@babel/traverse'

export default function() {
    return {
        visitor: {
            CallExpression(path: NodePath<types.CallExpression>, state) {
                // return if is not React call createElement expression
                let { callee } = path.node
                let b = 3;
                if (
                    !(
                        types.isMemberExpression(callee) &&
                        types.isIdentifier(callee.object) &&
                        callee.object.name === 'React' &&
                        types.isIdentifier(callee.property) &&
                        callee.property.name === 'createElement'
                    )
                ) {
                    return
                }

                // get the component type name and it's extra props options
                let [element, propsExpression] = path.node.arguments
                let elementType: string
                if (types.isStringLiteral(element)) {
                    elementType = element.value
                } else if (types.isIdentifier(element)) {
                    elementType = element.name
                }

                const options: Object = state.opts
                let extraProps: Object | undefined = options[elementType]

                if (!extraProps) {
                    return
                }

                // build the extra props ObjectExpression
                let stringLiteral = JSON.stringify(extraProps)
                let extraPropsExpression = parser.parseExpression(stringLiteral)

                // if the default props is null(empty)
                if (types.isNullLiteral(propsExpression)) {
                    path.node.arguments[1] = extraPropsExpression
                } else if (types.isObjectExpression(propsExpression)) {
                    path.node.arguments[1] = types.objectExpression(
                        propsExpression.properties.concat(
                            (<types.ObjectExpression>extraPropsExpression).properties,
                        ),
                    )
                }
            },
        },
    }
}
```

#### 第三步（打包测试）  
* 按`Ctrl` + `Shift` + `B`  选中npm:build打包好我们的项目代码。

  ![](http://39.108.184.64/image/79296075627188681592291163269.jpg)
  
* 在 `babel-project/index.ts`中任意位置加上断点，按F5     

  ![](http://39.108.184.64/image/87143975581244251592291184921.jpg)
 
最后执行完毕后就是我们插件修改后的代码啦

> lib/index.js

```javascript
let b = /*#__PURE__*/React.createElement(PPP, null, "1234");
let element = /*#__PURE__*/React.createElement(Button, {
  color: "red",
  "size": "small" // 这个是我们插件加入的
});
```
好吧，其实看完这个并不能教会你开发babel插件~~我也没说看了就能学会~~，只能告诉你如何调试一个简单的Babel插件。如果想要开发一个好的插件首先我们得找到人们编码时候的痛点，有了好的创意后在去熟悉babel提供的API和ECMA标准，以及它的AST格式。