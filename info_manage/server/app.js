const koa = require('koa')
const { loadMiddleware, loadRoutes } = require('./config/app.middleware')
const app = new koa()

const appConfig = require('./config/app.config')
const errorConfig = require('./config/app.error')
const resConfig = require('./config/app.res')
const token = require('jsonwebtoken')
loadMiddleware(app)
require('./models/Middle')
const { userApi } = require('./service/user')

/**
 * 全局拦截器
 * 1. 判断当前请求url是否在 notauth 中 indexOf
 *    在：直接放行 -> 意味着该接口是开放的
 *    不在：执行第二步
 * 2.验证 ctx.request.headers.authorization 是否存在
 *    存在：执行第三步
 *    不存在：直接抛出权限不足的异常
 * 3.根据authorization是否过期
 *    过期：抛出token过期异常
 *    没有过期：执行第四步
 * 4.根据authorization获取里面的用户信息
 *    将用户信息存储到ctx中
*/
const notauth = ['/api/login']
app.use(async (ctx, next) => {
  try {
    if (notauth.indexOf(ctx.request.url) !== -1) {
      await next()
    } else {
      if (ctx.request.headers.authorization === undefined) {
        ctx.throw(401, resConfig['401'])
      } else {
        try {
          ctx.uid = token.verify(ctx.request.headers.authorization, appConfig.secret).data
          await next()
        } catch (error) {
          ctx.throw(401, error)
        }
      }
    }
  } catch (error) {
    // 提交错误....
    ctx.app.emit('error', error, ctx)
  }
})

/**
 * 权限处理中间件
 * 1. 从ctx中获取当前登录用户的id
 *    ctx.uid
 * 2. 根据uid获取用户所属的角色
 * 3. 根据角色获取对应的Api
*/
app.use(async (ctx, next) => {
  if (notauth.indexOf(ctx.request.url) !== -1) {
    await next()
  } else {
    // await next()
    let url = ctx.request.url.split('?')[0]
    if (url.indexOf('detail') !== -1){
      url = url.replace(/detail\/.*/, 'detail/:id')
    } else if (url.indexOf('deleteById') !== -1) {
      url = url.replace(/deleteById\/.*/, 'deleteById/:id')
    }
    const apis = await userApi(ctx.uid)
    const index = apis.findIndex(item => item.path === url && item.type.toUpperCase() === ctx.request.method.toUpperCase())
    if (index !== -1) {
      await next()
    } else {
      ctx.throw(401, resConfig['401'])
    }
  }
})

// 全局错误处理
app.on('error', async(error, ctx) => {
  ctx.status = 200
  const code = error.status ? error.status : 500
  ctx.body = {
    code: code,
    msg: errorConfig[code], // 这个msg应该从数据库/配置文件中获取
    data: error.original ? error.original.sqlMessage : error.message // 判断是否是数据库发生的错误....
  }
})

// 路由自动加载
loadRoutes(app)

// 监听端口
app.listen(appConfig.port, () => {
  console.info(`server is running at port ${appConfig.port}`)
})
