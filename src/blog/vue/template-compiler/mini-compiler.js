/**
 * 一个极简模板编译器，用来演示 Vue 模板编译的主流程：
 *
 * template 字符串
 * -> parse 成 AST
 * -> transform 标记动态节点
 * -> generate 生成 render 函数代码
 * -> render 执行后返回 VNode
 *
 * 直接运行：
 * node src/blog/vue/template-compiler/mini-compiler.js
 *
 * 注意：
 * 这不是 Vue 编译器源码的完整复刻。
 * 它只支持少量语法：普通标签、普通属性、动态属性、文本、插值。
 * 目标是方便你调试和理解“模板为什么能变成 render 函数”。
 */

// AST 节点类型。
//
// Vue 编译器内部也会把模板解析成不同类型的节点。
// 这里为了方便理解，只保留四种：
// - ROOT：整棵模板 AST 的根节点。
// - ELEMENT：HTML 元素节点，比如 div、span。
// - TEXT：普通文本节点，比如“总价：”。
// - INTERPOLATION：插值节点，比如 {{ price * quantity }}。
const NodeTypes = {
  ROOT: 'Root',
  ELEMENT: 'Element',
  TEXT: 'Text',
  INTERPOLATION: 'Interpolation',
}

// patchFlag 是编译阶段给运行时留下的“更新提示”。
//
// 运行时更新 DOM 时，如果知道一个节点只有文本会变，
// 就不用把整个节点从头到尾都比较一遍。
//
// 这里用的数字是为了模拟 Vue 的位运算标记：
// TEXT = 1
// PROPS = 8
// TEXT | PROPS = 9
const PatchFlags = {
  TEXT: 1,
  PROPS: 8,
}

function compile(template) {
  // compile 是整个编译流程的入口。
  //
  // 可以把它看成一条流水线：
  // 1. parse：模板字符串 -> AST。
  // 2. transform：分析 AST，补充优化信息。
  // 3. generate：AST -> render 函数代码字符串。
  // 4. new Function：把代码字符串变成真正可执行的 render 函数。
  const ast = parse(template)

  transform(ast)

  const code = generate(ast)

  // 这里为了演示，直接用 new Function 把 render 代码跑起来。
  //
  // 真实 Vue 编译器不会像这里这么随意地 evaluate 表达式；
  // 这个 demo 只是为了让你能完整看到“代码字符串 -> render 函数 -> VNode”。
  const render = new Function('h', 'toDisplayString', 'evaluate', code)(
    h,
    toDisplayString,
    evaluate,
  )

  return {
    ast,
    code,
    render,
  }
}

function parse(template) {
  // parse 阶段最重要的设计是：用 context.source 保存“还没被解析的模板字符串”。
  //
  // 每解析出一个节点，就调用 advanceBy() 从 context.source 前面截掉一段。
  // 这样 parseChildren() 永远只需要看 source 的开头，就知道下一个节点是什么。
  const context = {
    source: template,
  }

  return {
    type: NodeTypes.ROOT,
    children: parseChildren(context, []),
  }
}

function parseChildren(context, ancestors) {
  // parseChildren 负责解析一组子节点。
  //
  // 例如：
  // <div>总价：{{ total }}</div>
  //
  // div 的 children 会被解析成：
  // [
  //   Text("总价："),
  //   Interpolation("total")
  // ]
  const nodes = []

  while (!isEnd(context, ancestors)) {
    const source = context.source
    let node

    // 如果当前剩余字符串以 {{ 开头，说明下一个节点是插值。
    if (source.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (source[0] === '<' && /[a-z]/i.test(source[1])) {
      // 如果当前剩余字符串以 < + 字母 开头，说明下一个节点是元素。
      //
      // 注意：这里没有处理注释、DOCTYPE、自闭合标签等复杂情况。
      node = parseElement(context, ancestors)
    } else {
      // 其他情况都当成普通文本处理。
      node = parseText(context)
    }

    nodes.push(node)
  }

  return nodes
}

function isEnd(context, ancestors) {
  const source = context.source

  // source 被消费完，说明整段模板解析结束。
  if (!source) {
    return true
  }

  // ancestors 是当前已经进入、但还没有闭合的父级元素栈。
  //
  // 例如正在解析：
  // <div><span>hello</span></div>
  //
  // 进入 span 的 children 时，ancestors 大致是：
  // [div, span]
  //
  // 如果此时 source 以 </span 开头，说明 span 的 children 解析结束了。
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    if (source.startsWith(`</${ancestors[i].tag}`)) {
      return true
    }
  }

  return false
}

function parseElement(context, ancestors) {
  // 元素解析分三步：
  // 1. 解析开始标签，比如 <div class="cart">。
  // 2. 递归解析 children。
  // 3. 解析结束标签，比如 </div>。
  const element = parseTag(context, 'start')

  // 把当前元素压入 ancestors，方便子节点判断遇到哪个结束标签时该停。
  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (!context.source.startsWith(`</${element.tag}`)) {
    throw new Error(`缺少结束标签：${element.tag}`)
  }

  // 消费掉结束标签。
  parseTag(context, 'end')

  return element
}

function parseTag(context, type) {
  // 这里只解析标签名。
  //
  // 对于 <div class="cart">：
  // match[0] 是 "<div"
  // match[1] 是 "div"
  //
  // 对于 </div>：
  // match[0] 是 "</div"
  // match[1] 是 "div"
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)

  if (!match) {
    throw new Error(`无法解析标签：${context.source}`)
  }

  const tag = match[1]

  // 先消费 "<div" 或 "</div" 这一段。
  advanceBy(context, match[0].length)

  // 跳过标签名后面的空格，方便继续解析属性或右尖括号。
  advanceSpaces(context)

  if (type === 'end') {
    // 结束标签不需要解析属性，只需要消费最后的 ">"。
    advanceBy(context, 1)
    return
  }

  // 开始标签需要继续解析属性。
  const props = parseAttributes(context)

  // 属性解析完后，消费最后的 ">"。
  advanceBy(context, 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children: [],
    patchFlag: 0,
  }
}

function parseAttributes(context) {
  // 解析开始标签上的属性。
  //
  // 例如：
  // class="cart" :data-count="quantity"
  //
  // 会被解析成：
  // [
  //   { name: "class", value: "cart", dynamic: false },
  //   { name: ":data-count", value: "quantity", dynamic: true }
  // ]
  const props = []

  while (!context.source.startsWith('>')) {
    advanceSpaces(context)

    // 这个正则只覆盖 demo 需要的属性形式：
    // name
    // name="value"
    // name='value'
    // name=value
    // :name="expression"
    //
    // 真实 Vue 编译器会处理更多情况，比如 v-bind、v-on、修饰符、动态参数等。
    const match = /^([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\t\r\n\f >]+)))?/.exec(
      context.source,
    )

    if (!match) {
      throw new Error(`无法解析属性：${context.source}`)
    }

    const name = match[1]
    const value = match[2] ?? match[3] ?? match[4] ?? true

    props.push({
      name,
      value,
      // 用 : 开头的属性，当成动态属性。
      //
      // 例如：
      // :data-count="quantity"
      //
      // 静态属性直接生成字符串，动态属性会生成表达式读取。
      dynamic: name.startsWith(':'),
    })

    // 消费掉刚才匹配到的属性字符串。
    advanceBy(context, match[0].length)
    advanceSpaces(context)
  }

  return props
}

function parseInterpolation(context) {
  // 插值表达式形如：
  // {{ price * quantity }}
  //
  // 这里先找到最近的 }}，然后取中间内容。
  const closeIndex = context.source.indexOf('}}')

  if (closeIndex === -1) {
    throw new Error('插值表达式缺少结束符 }}')
  }

  const content = context.source.slice(2, closeIndex).trim()

  // 消费掉完整插值，包括开头的 {{ 和结尾的 }}。
  advanceBy(context, closeIndex + 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content,
  }
}

function parseText(context) {
  // 文本节点会一直读到下一个特殊语法之前。
  //
  // 特殊语法目前只有两种：
  // 1. {{：插值开始。
  // 2. <：元素开始或结束标签开始。
  let endIndex = context.source.length

  const interpolationIndex = context.source.indexOf('{{')
  const elementIndex = context.source.indexOf('<')

  if (interpolationIndex !== -1 && interpolationIndex < endIndex) {
    endIndex = interpolationIndex
  }

  if (elementIndex !== -1 && elementIndex < endIndex) {
    endIndex = elementIndex
  }

  const content = context.source.slice(0, endIndex)

  // 消费掉文本内容。
  advanceBy(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function transform(node) {
  // transform 阶段用来“分析和改造 AST”。
  //
  // 这个 mini compiler 只做一件事：
  // 根据节点是否包含动态文本、动态属性，给元素节点打 patchFlag。
  walk(node)
  return node
}

function walk(node) {
  if (!node.children) {
    return
  }

  // 先处理子节点，再处理当前节点。
  //
  // 真实编译器里经常需要这种深度优先遍历，
  // 因为父节点的优化信息可能依赖子节点分析结果。
  node.children.forEach(walk)

  if (node.type !== NodeTypes.ELEMENT) {
    return
  }

  // 如果 children 里有插值，说明这个元素的文本内容包含动态表达式。
  //
  // 例如：
  // <div>总价：{{ price * quantity }}</div>
  //
  // 这里会打上 TEXT 标记。
  if (node.children.some((child) => child.type === NodeTypes.INTERPOLATION)) {
    node.patchFlag |= PatchFlags.TEXT
  }

  // 如果 props 里有动态属性，说明这个元素的属性值需要运行时重新计算。
  //
  // 例如：
  // <div :data-count="quantity"></div>
  //
  // 这里会打上 PROPS 标记。
  if (node.props.some((prop) => prop.dynamic)) {
    node.patchFlag |= PatchFlags.PROPS
  }
}

function generate(ast) {
  // generate 阶段把 AST 变成一段 render 函数代码。
  //
  // 生成结果不是直接的函数，而是一个字符串：
  //
  // return function render(_ctx) {
  //   return h(...)
  // }
  //
  // 之后 compile() 再用 new Function 把这段字符串变成真正的函数。
  return `return function render(_ctx) {
  return ${genRootChildren(ast.children)}
}`
}

function genRootChildren(children) {
  // 根节点可以没有子节点、一个子节点，或者多个子节点。
  //
  // 多个根节点时，用 Fragment 包起来，模拟 Vue 3 支持多根节点的行为。
  if (children.length === 0) {
    return 'null'
  }

  if (children.length === 1) {
    return genNode(children[0])
  }

  return `h("Fragment", null, [${children.map(genNode).join(', ')}])`
}

function genElementChildren(children) {
  // 元素节点的 children 和根节点不同。
  //
  // 如果一个 div 内部有多个子节点：
  // <div>总价：{{ total }}</div>
  //
  // 它的 children 应该是数组：
  // ["总价：", toDisplayString(...)]
  //
  // 不需要再套一层 Fragment。
  if (children.length === 0) {
    return 'null'
  }

  if (children.length === 1) {
    return genNode(children[0])
  }

  return `[${children.map(genNode).join(', ')}]`
}

function genNode(node) {
  // 根据不同 AST 节点类型，生成不同的 JavaScript 表达式。
  switch (node.type) {
    case NodeTypes.ELEMENT:
      return genElement(node)
    case NodeTypes.TEXT:
      // 普通文本要 JSON.stringify，避免中文、引号、换行等内容破坏生成代码。
      return JSON.stringify(node.content)
    case NodeTypes.INTERPOLATION:
      // 插值表达式需要在 render 执行时基于 _ctx 求值。
      //
      // 例如 {{ price * quantity }} 会生成：
      // toDisplayString(evaluate(_ctx, "price * quantity"))
      return `toDisplayString(evaluate(_ctx, ${JSON.stringify(node.content)}))`
    default:
      throw new Error(`未知节点类型：${node.type}`)
  }
}

function genElement(node) {
  // 元素节点会生成一次 h() 调用。
  //
  // h(type, props, children, patchFlag)
  //
  // 例如：
  // <div class="cart">hello</div>
  //
  // 会生成：
  // h("div", { "class": "cart" }, "hello")
  const props = genProps(node.props)
  const children = genElementChildren(node.children)

  // 没有动态内容时，不传 patchFlag。
  // 有动态内容时，把 patchFlag 作为第四个参数传给 h()。
  const patchFlag = node.patchFlag ? `, ${node.patchFlag}` : ''

  return `h(${JSON.stringify(node.tag)}, ${props}, ${children}${patchFlag})`
}

function genProps(props) {
  if (props.length === 0) {
    return 'null'
  }

  const entries = props.map((prop) => {
    // :data-count 生成时要去掉前面的冒号，真正的属性名是 data-count。
    const name = prop.dynamic ? prop.name.slice(1) : prop.name

    // 静态属性直接生成字符串：
    // class="cart" -> { "class": "cart" }
    //
    // 动态属性生成表达式：
    // :data-count="quantity" -> { "data-count": evaluate(_ctx, "quantity") }
    const value = prop.dynamic
      ? `evaluate(_ctx, ${JSON.stringify(prop.value)})`
      : JSON.stringify(prop.value)

    return `${JSON.stringify(name)}: ${value}`
  })

  return `{ ${entries.join(', ')} }`
}

function h(type, props, children, patchFlag = 0) {
  // h() 是一个极简版 createVNode。
  //
  // 真实 Vue 里的 VNode 字段更多，比如 key、ref、shapeFlag、component 等。
  // 这里保留 type / props / children / patchFlag，已经足够观察编译结果。
  return {
    type,
    props,
    children,
    patchFlag,
  }
}

function toDisplayString(value) {
  // Vue 模板插值最终要变成页面文本。
  //
  // null 和 undefined 在模板里通常显示为空字符串。
  return value == null ? '' : String(value)
}

function evaluate(ctx, expression) {
  // 这是 demo 里的表达式求值器。
  //
  // 例如：
  // expression = "price * quantity"
  // ctx = { price: 10, quantity: 2 }
  //
  // 最终会得到 20。
  //
  // 注意：真实项目不要这样执行不可信字符串。
  // 这里使用 new Function + with 只是为了把 mini compiler 的代码压到最短。
  return new Function('_ctx', `with (_ctx) { return (${expression}) }`)(ctx)
}

function advanceBy(context, length) {
  // 从 context.source 开头消费指定长度的字符串。
  //
  // parse 的过程就是不断消费 source 的过程。
  context.source = context.source.slice(length)
}

function advanceSpaces(context) {
  // 消费空白字符。
  //
  // 这样 parseTag / parseAttributes 不需要反复处理标签和属性之间的空格。
  const match = /^[\t\r\n\f ]+/.exec(context.source)

  if (match) {
    advanceBy(context, match[0].length)
  }
}

function runDemo() {
  // 这个模板故意同时包含：
  // - 静态属性 class。
  // - 动态属性 :data-count。
  // - 静态文本 “总价：”。
  // - 动态插值 {{ price * quantity }}。
  //
  // 这样一次运行就能观察 parse / transform / generate 的核心结果。
  const template = '<div class="cart" :data-count="quantity">总价：{{ price * quantity }}</div>'
  const result = compile(template)

  console.log('\n===== template =====')
  console.log(template)

  console.log('\n===== AST =====')
  console.log(JSON.stringify(result.ast, null, 2))

  console.log('\n===== render code =====')
  console.log(result.code)

  console.log('\n===== VNode =====')
  console.log(
    JSON.stringify(
      result.render({
        price: 10,
        quantity: 2,
      }),
      null,
      2,
    ),
  )
}

function toFileUrl(filePath) {
  // 这个函数只服务于“直接用 node 运行此文件”的判断。
  //
  // 因为这个文件也可能被其他模块 import，
  // 所以不能一被 import 就自动执行 runDemo()。
  const normalizedPath = filePath.replaceAll('\\', '/')
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`

  return `file://${encodeURI(absolutePath)}`
}

const isRunningDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  import.meta.url === toFileUrl(process.argv[1])

if (isRunningDirectly) {
  runDemo()
}

export { compile, generate, h, parse, transform }
