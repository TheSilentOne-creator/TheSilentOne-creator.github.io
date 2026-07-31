// docs/config/sidebar.js
// ============================================================
// 侧边栏配置 - 所有教程的目录树
// ============================================================

const SIDEBAR_CONFIG = [
    {
        category: '⚔️ 基础工具',
        items: [
            { 
                text: '01. 玩转 Markdown', 
                link: '/tutorials/01-markdown/',
                status: 'done'      // done | writing | coming
            },
            { 
                text: '02. 玩转 VS Code', 
                link: '/tutorials/02-vscode/',
                status: 'done'
            },
            { 
                text: '03. Vim 从入门到得体', 
                link: '/tutorials/03-vim/',
                status: 'done'
            },
            { 
                text: '04. 拿捏 Git 与 GitHub', 
                link: '/tutorials/04-git/',
                status: 'coming'
            }
        ]
    },
    {
        category: '🌐 网络安全',
        items: [
            { 
                text: '05. 这才是网络安全（全六季）', 
                link: '/tutorials/05-cybersecurity/',
                status: 'writing'
            }
        ]
    },
    {
        category: '🚀 进阶之路',
        items: [
            { 
                text: '06. Python 写安全工具', 
                link: '/tutorials/06-python/',
                status: 'coming'
            },
            { 
                text: '07. Rust：灰烬之战', 
                link: '/tutorials/07-rust/',
                status: 'writing'
            },
            { 
                text: '08. 详解计算机科学丛书', 
                link: '/tutorials/08-cs-canon/',
                status: 'writing'
            }
        ]
    }
]