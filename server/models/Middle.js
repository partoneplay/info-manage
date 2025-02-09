const User = require('./User')
const Role = require('./Role')
const Menu = require('./Menu')
const Api = require('./Api')
const ApiType = require('./ApiType')
const Collect = require('./Collect')
const CollectType = require('./CollectType')
const Account = require('./Account')
const AccountTag = require('./AccountTag')
const Password = require('./Password')
const Memory = require('./Memory')
const Task = require('./Task')
const Project = require('./Project')
const ProjectImage = require('./ProjectImage')
const ProjectIssue = require('./ProjectIssue')
const ProjectDocument = require('./ProjectDocument')
const Chart = require('./Chart')
const Dashboard = require('./Dashboard')

// 用户角色表
User.belongsToMany(Role, { through: 'user_role', as:'ur' })
Role.belongsToMany(User, { through: 'user_role', as:'ur' })

// 角色菜单表
Role.belongsToMany(Menu, { through: 'role_menu', as: 'rm' })
Menu.belongsToMany(Role, { through: 'role_menu', as: 'rm' })

// 菜单与菜单自关联
Menu.hasMany(Menu, { as: 'children', foreignKey: 'pid', through: null })

// api与api_type关联
ApiType.hasMany(Api, { foreignKey: 'tid', sourceKey: 'id' })
Api.belongsTo(ApiType, { foreignKey: 'tid', sourceKey: 'id' })

// role与api表关联
Role.belongsToMany(Api, { through: 'role_api', as: 'ra' })
Api.belongsToMany(Role, { through: 'role_api', as: 'ra' })

// Collect 与 Collect_type 以及 User关联
CollectType.hasMany(Collect, { foreignKey: 'tid', sourceKey: 'id' })
Collect.belongsTo(CollectType, { foreignKey: 'tid', sourceKey: 'id' })
Collect.belongsTo(User, { foreignKey: 'uid', sourceKey: 'id' })

// Account、AccountTag 与 User关联
// 一个用户用于：多个Account和AccountTag
User.hasMany(AccountTag, { foreignKey: 'uid', sourceKey: 'id' })
User.hasMany(Account, { foreignKey: 'uid', sourceKey: 'id' })

// Password 与 User 关联
User.hasMany(Password, { foreignKey: 'uid', sourceKey: 'id' })
Password.belongsTo(User, { foreignKey: 'uid', sourceKey: 'id' })

// Memory 与 User 关联
User.hasMany(Memory, { foreignKey: 'uid', sourceKey: 'id' })
Memory.belongsTo(User, { foreignKey: 'uid', sourceKey: 'id' })

// Task 与 User 关联
User.hasMany(Task, { foreignKey: 'uid', sourceKey: 'id' })
Task.belongsTo(User, { foreignKey: 'uid', sourceKey: 'id' })

// Project 与 User 关联
User.hasMany(Project, { foreignKey: 'uid', sourceKey: 'id' })
Project.belongsTo(User, { foreignKey: 'uid', sourceKey: 'id' })

// Project 与 ProjectImage 关联
Project.hasMany(ProjectImage, { foreignKey: 'pid', sourceKey: 'id' })
ProjectImage.belongsTo(Project, { foreignKey: 'pid', sourceKey: 'id' })

// Project 与 ProjectIssue 关联
Project.hasMany(ProjectIssue, { foreignKey: 'pid', sourceKey: 'id' })
ProjectIssue.belongsTo(Project, { foreignKey: 'pid', sourceKey: 'id' })

// Project 与 ProjectDocument 关联
Project.hasMany(ProjectDocument, { foreignKey: 'pid', sourceKey: 'id' })
ProjectDocument.belongsTo(Project, { foreignKey: 'pid', sourceKey: 'id' })


// 向外抛出所有的model：后续使用就只需要引入这一个 model 即可
module.exports = {
  User,
  Role,
  Menu,
  Api,
  ApiType,
  Collect,
  CollectType,
  Account,
  AccountTag,
  Password,
  Memory,
  Task,
  Project,
  ProjectImage,
  ProjectIssue,
  ProjectDocument,
  Dashboard,
  Chart
}