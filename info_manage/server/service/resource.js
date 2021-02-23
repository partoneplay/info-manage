const { Resource, Account } = require('../models/Middle')
const { Op } = require("sequelize")
const sequelize = require('../utils/seq')
const util = require('../utils/util')
const moment = require('moment')
const fs = require('fs')
// 删除文件/非空文件夹/空文件夹
const rimraf = require('rimraf')
const path = require('path')


/**
 * 新增资源
 * 还需要先判断是否传pid
 * 传入：需要单独做操作
 * 没传：执行后续步骤
 * 1. 根据用户id查找该文件夹是否存在
 *    不存在：新增一个文件夹(名称为用户id)，到第二步
 *    存在：到第二步
 * 2. 判断新增文件夹名是否存在
 *    存在：跳过
 *    不存在：则新增
 * 3. 将数据存储到数据库中
 */
async function add (resource) {
  try {
    let dir = ''
    if (resource.pid) {
      const tmp = await Resource.findOne({
        where: {
          id: resource.pid,
          uid: resource.uid
        },
        raw: true
      })
      if (tmp === null) {
        dir = path.join(__dirname, '../resource/', resource.uid, resource.name)
        resource.pid = null
      } else {
        dir = path.join(__dirname, '..', tmp.path, resource.name)
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        resource.path = dir.replace(path.join(__dirname, '..'), '')
        resource.is_dir = true
        resource.ctime = moment().format('YYYY-MM-DD HH:mm:ss')
        resource.mtime = moment().format('YYYY-MM-DD HH:mm:ss')
        return await Resource.create(resource)
      }
      throw new Error(`${resource.name} 目录已存在`)
    } else {
      dir = path.join(__dirname, '../resource/', resource.uid, resource.name)
      // 判断文件/文件夹已存在
      // 不存在：创建目录，设置recursive: true 会按照层次依次创建目录
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        resource.path = dir.replace(path.join(__dirname, '..'), '')
        resource.is_dir = true
        resource.ctime = moment().format('YYYY-MM-DD HH:mm:ss')
        resource.mtime = moment().format('YYYY-MM-DD HH:mm:ss')
        return await Resource.create(resource)
      }
      throw new Error(`${resource.name} 目录已存在`)
    }
  } catch (error) {
    throw error
  }
}

/**
 * 删除数据
 * 1. 根据id查询数据信息
 */
async function deleteById (id, uid) {
  try {
    // 1. 根据id和用户id获取数据
    const resource = await Resource.findOne({
      where: {
        id,
        uid
      },
      raw: true
    })
    // 排除没有数据的时候
    if (!resource) util.sendError(404, '资源Not Found')
    // 删除本地文件数据
    // 然后删除数据库数据：包括删除当前这条数据以及所有子数据
    rimraf.sync(path.join(__dirname, '..', resource.path))
    await Resource.destroy({
      where: {
        pid: resource.id,
        uid
      }
    })
    await Resource.destroy({
      where: {
        id,
        uid
      }
    })
    return resource
  } catch (error) {
    throw error
  }
}

/**
 * 更新
 * 1. 更新本地文件
 * 2. 更新数据库数据
 */
async function update (resource, uid) {
  try {
    resource.mtime = moment().format('YYYY-MM-DD HH:mm:ss')
    const oldPath = path.join(__dirname, '..', resource.path)
    const newPath = path.join(__dirname, '..', resource.path.substring(0, resource.path.lastIndexOf('\\')), resource.name)
    resource.path = newPath.replace(path.join(__dirname, '..'), '')
    fs.renameSync(oldPath, newPath)
    return await Resource.update(resource, {
      where: {
        id: resource.id,
        uid
      }
    })
  } catch (error) {
    throw error
  }
}

// 查询
async function detail (id, uid) {
  try {
    return await Resource.findOne({
      where: {
        id,
        uid
      }
    })
  } catch (error) {
    throw error
  }
}

/**
 * 查询列表
 * @param {*} query
 *  size: 每页显示数量 默认10
 *  page：当前所在页码 默认0
 *  sort：排序字段 默认ctime
 *  order：排序方式 默认desc
 *  search: 搜索 默认%%
 *  type: 支付/收入
 *  pay：支付方式
 *  template：是否模板
 *  start：开始时间
 *  end：结束时间
 */
async function list (query, uid) {
  try {
    const limit = query.size ? parseInt(query.size) : 10
    const { count, rows } = await Account.findAndCountAll({
      where: {
        [Op.or]: [
          { remark:  { [Op.like]: query.search ?  `%${query.search}%` : '%%' } },
          { ctime:  { [Op.like]: query.search ?  `%${query.search}%` : '%%' } },
          { mtime:  { [Op.like]: query.search ?  `%${query.search}%` : '%%' } }
        ],
        ptime: {
          [Op.between]: [
            query.start ? query.start : await Account.min('ptime', { where: { uid } }),
            query.end ? query.end : await Account.max('ptime', { where: { uid } })
          ]
        },
        pay: {
          [Op.like]: query.pay ? `%${query.pay}%` : '%%'
        },
        template: {
          [Op.like]: query.template ? `%${JSON.parse(query.template) ? 1 : 0}%` : '%%'
        },
        type: {
          [Op.like]: query.type ? `%${JSON.parse(query.type) ? 1 : 0}%` : '%%'
        },
        uid
      },
      order: [
        [query.sort ? query.sort : 'ptime', query.order ? query.order : 'desc']
      ],
      limit: limit,
      offset: query.page ? (parseInt(query.page) - 1) * limit : 0
    })
    return {
      total: count,
      data: rows
    }
  } catch (error) {
    throw error
  }
}


module.exports =  {
  add,
  deleteById,
  update,
  detail,
  list
}