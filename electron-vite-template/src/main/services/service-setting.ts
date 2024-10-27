import { app } from "electron";
import path from "path";
import { access, constants, readFile, writeFile } from "fs/promises";
import assert from "assert";
import _ from 'lodash';
import '../ipc-bind/setting-ipc-bind'

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'settings.json')
console.log("配置地址", configPath)
const settins_menu: Array<Menu> = [
    {
        name: "通用",
        key: "general",
        subs: [
            {
                name: "测试",
                key: "test",
            }
        ]
    },
    {
        name: "网络",
        key: "network",
    },
    {
        name: "外观",
        key: "appearance",
    },
    {
        name: "插件",
        key: "plugins",
    }
];
export type Menu = {
    name: string,
    key: string,
    page?: string,
    path?: string,
    subs?: Array<Menu> | null;
}
/**
 * 为菜单项生成路径
 * @param menu - 单个菜单项或菜单项数组
 * @param parentPath - 可选的父路径，如果没有传入则默认空字符串
 */
function generateMenuPath(menu: Menu | Menu[], parentPath?: string): void {
    if (Array.isArray(menu)) {
        // 如果是数组，递归处理每个子菜单
        menu.forEach((item) => generateMenuPath(item, parentPath));
    } else {
        // 生成当前菜单的路径
        menu.path = parentPath ? `${parentPath}.${menu.key}` : menu.key;
        // 如果有子菜单，递归处理子菜单
        if (menu.subs && menu.subs.length > 0) {
            generateMenuPath(menu.subs, menu.path);
        }
    }
}
generateMenuPath(settins_menu);
function foundSetting(target: string, _menus = settins_menu): Menu | null {
    const index = target.indexOf(".");
    const current = target.substring(0, index > 1 ? index : target.length);
    const remain = index > 1 ? target.substring(index + 1, target.length) : null;
    for (const menu of _menus) {
        if (menu.key === current) {
            if (remain) {
                if (menu.subs) {
                    return foundSetting(remain, menu.subs);
                }
            } else {
                return menu;
            }
        }
    }
    return null;
}
const checkMenu = (menu: Menu) => {

}

export const registeMenu = (menus: Menu | Array<Menu>, path?: string) => {
    if (!menus || (Array.isArray(menus) && menus.length === 0)) {
        throw new Error("空菜单项")
    }
    if (!Array.isArray(menus)) {
        menus = [menus];
    }
    let _target_menus = settins_menu;
    let foundMenu: Menu;
    if (path) {
        foundMenu = foundSetting(path);
        assert.ok(foundMenu, `菜单路径[${path}]没有找到`)
        if (!foundMenu.subs) {
            foundMenu.subs = [];
        }
        _target_menus = foundMenu.subs;
    }
    for (const menu of menus) {
        assert.ok(menu.key && menu.name, "菜单项必须有key和name")
        // assert.ok(!menu.subs && menu.page, `菜单[${menu}]必须设置界面`)
        for (const _exist_menu of _target_menus) {
            assert.ok(_exist_menu.name !== menu.name, `菜单名[${menu.name}]已被使用`)
            assert.ok(_exist_menu.key !== menu.key, `菜单名[${menu.name}]已被使用`)
        }
        generateMenuPath(menu, foundMenu?.path)
        _target_menus.push(menu);
    }
}
export const getSettingValue = async (key: string) => {
    const config = await getSettingConfig();
    const value = _.get(config, key)
    return value;
}
export const saveSettingValue = async (key: string, value: any) => {
    const config = await getSettingConfig();
    const old = { ...config };
    _.set(config, key, value);
    writeFile(configPath, JSON.stringify(config), 'utf8')
}
export const getSettingConfig = async () => {
    // 先检查文件是否存在
    try {
        await access(configPath, constants.F_OK);
        const data = await readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // 如果文件不存在，创建文件并返回空对象
        if (err.code === 'ENOENT') {
            return {};
        } else {
            // 如果是其他错误，则抛出
            throw new Error("读取文件时异常" + configPath, { cause: err });
        }
    }
}

export const getSettings = (path?: string) => {
    return path ? foundSetting(path) : settins_menu;
}
