"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// parser
const parser = require("@babel/parser");
// 各种 Node 类型定义
const types = require("@babel/types");
function default_1() {
    return {
        // 我们的 visitor
        visitor: {
            Identifier(path) {
                console.log(path);
            },
            // 针对函数调用的单独逻辑处理
            CallExpression(path, state) {
                // 我们只处理 React.createElement 函数调用
                let { callee } = path.node;
                if (!(types.isMemberExpression(callee) &&
                    types.isIdentifier(callee.object) &&
                    callee.object.name === 'React' &&
                    types.isIdentifier(callee.property) &&
                    callee.property.name === 'createElement')) {
                    return;
                }
                // 从第一个参数获取组件名称（Button）
                // 从第二个参数获取组件属性
                let [element, propsExpression] = path.node.arguments;
                let elementType;
                if (types.isStringLiteral(element)) {
                    elementType = element.value;
                }
                else if (types.isIdentifier(element)) {
                    elementType = element.name;
                }
                // 我们的插件支持自定义选项，针对不同的组件类型传入不同的额外自定义属性
                const options = state.opts;
                let extraProps = options[elementType];
                // 如果没有针对次组件类型的额外参数，我们的插件什么都不做
                if (!extraProps) {
                    return;
                }
                // 否则，我们利用 parser.parseExpression 方法以及我们的自定义属性生成一个 ObjectExpression
                let stringLiteral = JSON.stringify(extraProps);
                let extraPropsExpression = parser.parseExpression(stringLiteral);
                // 如果组件原本 props 为空，我们直接将我们的自定义属性作为属性参数
                if (types.isNullLiteral(propsExpression)) {
                    path.node.arguments[1] = extraPropsExpression;
                }
                else if (types.isObjectExpression(propsExpression)) {
                    // 否则，我们将我们的自定义属性与原属性进行合并（只处理对象类型的 props）
                    path.node.arguments[1] = types.objectExpression(propsExpression.properties.concat(extraPropsExpression.properties));
                }
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map