import { app, BaseWindow, dialog, Menu, MenuItem } from "electron";
import { access, constants, readFile, writeFile } from "fs/promises";
import assert from "assert";
import _ from 'lodash';
import '../ipc-bind/setting-ipc-bind'
import EventEmitter from "events";
import '../ipc-bind/menus-ipc-bind'

import { type, arch, release } from "os";
import { version } from "../../../package.json";
const eventer = new EventEmitter();
export const onSettingChange = (path: string, callback: (value: any) => void) => {
    eventer.on("SettingChange", callback);
};
const settins_menu: Array<MenuDesc> = [
    {
        label: "通用",
        key: "general",
        submenu: [
            {
                label: "退出",
                key: "exit",
                accelerator: "CmdOrCtrl+F4",
                role: "close",
            },
        ]
    },
    {
        label: "网络",
        key: "network",
    },
    {
        label: "外观",
        key: "appearance",
    },
    {
        label: "帮助",
        key: "help",
        submenu: [
            {
                label: '关于',
                key: "about",
                click: () => {
                    dialog.showMessageBox({
                        title: "关于",
                        type: "info",
                        message: "electron-Vue框架",
                        detail: `版本信息：${version}\n引擎版本：${process.versions.v8
                            }\n当前系统：${type()} ${arch()} ${release()}`,
                        noLink: true,
                        buttons: ["查看github", "确定"],
                    });
                }
            },
            {
                label: "切换到开发者模式",
                accelerator: "CmdOrCtrl+I",
                key: "devTools",
                role: "toggleDevTools",
            }
        ]
    }
];
export type MenuDesc = {
    label: string,
    key: string,
    checked?: boolean,
    id?: string,
    type?: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'),
    role?: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle' | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools' | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'toggleSpellChecker' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideOthers' | 'unhide' | 'quit' | 'showSubstitutions' | 'toggleSmartQuotes' | 'toggleSmartDashes' | 'toggleTextReplacement' | 'startSpeaking' | 'stopSpeaking' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'shareMenu' | 'recentDocuments' | 'toggleTabBar' | 'selectNextTab' | 'selectPreviousTab' | 'showAllTabs' | 'mergeAllWindows' | 'clearRecentDocuments' | 'moveTabToNewWindow' | 'windowMenu'
    submenu?: Array<MenuDesc> | null,
    accelerator?: string,
    click?: (menuItem: MenuItem, window: (BaseWindow) | (undefined), event: KeyboardEvent) => void;
}
/**
 * 为菜单项生成路径
 * @param menu - 单个菜单项或菜单项数组
 * @param parentPath - 可选的父路径，如果没有传入则默认空字符串
 */
function generateMenuPath(menu: MenuDesc | MenuDesc[], parentPath?: string): void {
    if (Array.isArray(menu)) {
        // 如果是数组，递归处理每个子菜单
        menu.forEach((item) => generateMenuPath(item, parentPath));
    } else {
        // 生成当前菜单的路径
        menu.id = parentPath ? `${parentPath}.${menu.key}` : menu.key;
        // 如果有子菜单，递归处理子菜单
        if (menu.submenu && menu.submenu.length > 0) {
            menu.type = 'submenu'
            generateMenuPath(menu.submenu, menu.id);
        } else {
            menu.click || (menu.click = () => { console.log("点击") });
        }
    }
}
generateMenuPath(settins_menu);

function foundSetting(target: string, _menus = settins_menu): MenuDesc | null {
    const index = target.indexOf(".");
    const current = target.substring(0, index > 1 ? index : target.length);
    const remain = index > 1 ? target.substring(index + 1, target.length) : null;
    for (const menu of _menus) {
        if (menu.key === current) {
            if (remain) {
                if (menu.submenu) {
                    return foundSetting(remain, menu.submenu);
                }
            } else {
                return menu;
            }
        }
    }
    return null;
}
const checkMenu = (menu: MenuDesc) => {

}

export const registeMenu = (menus: MenuDesc | Array<MenuDesc>, path?: string) => {
    if (!menus || (Array.isArray(menus) && menus.length === 0)) {
        throw new Error("空菜单项")
    }
    if (!Array.isArray(menus)) {
        menus = [menus];
    }
    let _target_menus = settins_menu;
    let foundMenu: MenuDesc;

    if (path) {
        foundMenu = foundSetting(path);
        assert.ok(foundMenu, `菜单路径[${path}]没有找到`)
        if (!foundMenu.submenu) {
            foundMenu.submenu = [];
        }
        _target_menus = foundMenu.submenu;
    }
    for (const menu of menus) {
        assert.ok(menu.key && menu.label, "菜单项必须有key和name")
        // assert.ok(!menu.subs && menu.page, `菜单[${menu}]必须设置界面`)
        for (const _exist_menu of _target_menus) {
            assert.ok(_exist_menu.label !== menu.label, `菜单名[${menu.label}]已被使用`)
            assert.ok(_exist_menu.key !== menu.key, `菜单key[${menu.key}]已被使用`)
        }
        generateMenuPath(menu, foundMenu?.id)
        _target_menus.push(menu);
    }
    refreshMenu()
}
export const getMenus = (path?: string) => {
    return path ? foundSetting(path) : settins_menu;
}

export const refreshMenu = () => {
    // 赋予模板
    const menuTemplate = Menu.buildFromTemplate(getMenus() as any);
    // // 加载模板
    Menu.setApplicationMenu(menuTemplate);
}
refreshMenu()