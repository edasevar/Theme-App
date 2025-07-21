"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationProvider = void 0;
const vscode = __importStar(require("vscode"));
class NavigationProvider {
    static async showElementExamples(context, property) {
        const elementInfo = this.getElementInfo(property);
        const panel = vscode.window.createWebviewPanel('themeElementExamples', `Theme Element: ${property}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri]
        });
        panel.webview.html = this.getExamplesHtml(elementInfo);
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'navigateToElement':
                    await this.navigateToElement(message.property);
                    break;
                case 'showInSettings':
                    await this.showInSettings(message.property);
                    break;
                case 'copyProperty':
                    await vscode.env.clipboard.writeText(message.property);
                    vscode.window.showInformationMessage(`Copied: ${message.property}`);
                    break;
                case 'openRelated':
                    await this.showElementExamples(context, message.relatedProperty);
                    break;
                case 'testColor':
                    await this.testColorOnElement(message.property, message.color);
                    break;
            }
        }, undefined, context.subscriptions);
    }
    static getElementInfo(property) {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        return this.elementDatabase.get(property) || {
            property,
            description: `Theme property: ${property}`,
            example: 'No specific example available',
            location: 'Various locations in VS Code UI',
            relatedProperties: []
        };
    }
    static initializeElementDatabase() {
        const elements = [
            // =================================================
            // EDITOR ELEMENTS
            // =================================================
            {
                property: 'editor.background',
                description: 'The main background color of the editor where you write code',
                example: 'The large area behind your code text - the canvas where all your code appears',
                location: 'Main editor window, code editing area',
                relatedProperties: ['editor.foreground', 'editor.lineHighlightBackground', 'editorGutter.background'],
                vsCodeCommand: 'workbench.action.files.newUntitledFile',
                demoCode: `function hello() {
    // This background color affects this entire area
    console.log("editor.background controls this space");
    return "The canvas behind all code";
}`
            },
            {
                property: 'editor.foreground',
                description: 'The default text color for code in the editor',
                example: 'The color of regular text that doesn\'t have syntax highlighting (like plain text)',
                location: 'Text content in the main editor',
                relatedProperties: ['editor.background', 'editorCursor.foreground', 'editor.selectionForeground'],
                demoCode: `// This text color is controlled by editor.foreground
const message = "Default text color for non-highlighted code";
// Comments and plain text use this color`
            },
            {
                property: 'editor.lineHighlightBackground',
                description: 'Background color of the currently selected/active line',
                example: 'Subtle highlight behind the line where your cursor is positioned',
                location: 'Current line in editor (where cursor is located)',
                relatedProperties: ['editor.background', 'editor.lineHighlightBorder', 'editorLineNumber.activeForeground']
            },
            {
                property: 'editor.lineHighlightBorder',
                description: 'Border color around the currently highlighted line',
                example: 'Optional border that can outline the current line',
                location: 'Border around the current line in editor',
                relatedProperties: ['editor.lineHighlightBackground', 'editor.background']
            },
            {
                property: 'editor.selectionBackground',
                description: 'Background color of selected text',
                example: 'Highlight color when you select code with mouse or keyboard (Shift+Arrow)',
                location: 'Selected text in editor',
                relatedProperties: ['editor.selectionForeground', 'editor.inactiveSelectionBackground', 'editor.selectionHighlightBackground']
            },
            {
                property: 'editor.selectionForeground',
                description: 'Text color of selected text',
                example: 'The color of text when it\'s selected (often contrasts with selection background)',
                location: 'Text color within selected areas',
                relatedProperties: ['editor.selectionBackground', 'editor.foreground']
            },
            {
                property: 'editor.inactiveSelectionBackground',
                description: 'Background color of selected text when editor is not focused',
                example: 'Selection highlight when you click outside the editor but text remains selected',
                location: 'Selected text in unfocused editor',
                relatedProperties: ['editor.selectionBackground', 'editor.background']
            },
            {
                property: 'editor.wordHighlightBackground',
                description: 'Background color for highlighting other instances of selected word',
                example: 'When you select a word, other instances get this background color',
                location: 'Word instances throughout the editor',
                relatedProperties: ['editor.wordHighlightBorder', 'editor.wordHighlightStrongBackground']
            },
            {
                property: 'editor.findMatchBackground',
                description: 'Background color for search results in find/replace',
                example: 'Highlights search matches when using Ctrl+F find functionality',
                location: 'Search result highlights in editor',
                relatedProperties: ['editor.findMatchHighlightBackground', 'editor.findRangeHighlightBackground'],
                vsCodeCommand: 'actions.find'
            },
            {
                property: 'editorCursor.foreground',
                description: 'Color of the text cursor/caret in the editor',
                example: 'The blinking vertical line that shows where you\'re typing',
                location: 'Text cursor in editor',
                relatedProperties: ['editor.foreground', 'editor.background']
            },
            {
                property: 'editorLineNumber.foreground',
                description: 'Color of line numbers in the editor gutter',
                example: 'The numbers on the left side showing line counts (1, 2, 3...)',
                location: 'Line numbers in left gutter',
                relatedProperties: ['editorLineNumber.activeForeground', 'editorGutter.background'],
                vsCodeCommand: 'editor.action.toggleRenderWhitespace'
            },
            {
                property: 'editorLineNumber.activeForeground',
                description: 'Color of the active line number (current line)',
                example: 'The line number for the row where your cursor is - usually brighter',
                location: 'Active line number in left gutter',
                relatedProperties: ['editorLineNumber.foreground', 'editor.lineHighlightBackground']
            },
            {
                property: 'editorGutter.background',
                description: 'Background color of the line number gutter area',
                example: 'The vertical strip on the left containing line numbers and git indicators',
                location: 'Left gutter area with line numbers',
                relatedProperties: ['editorLineNumber.foreground', 'editor.background']
            },
            {
                property: 'editorIndentGuide.background1',
                description: 'Color of indentation guide lines in the editor',
                example: 'Vertical lines showing code indentation levels',
                location: 'Indentation guide lines throughout code',
                relatedProperties: ['editorIndentGuide.activeBackground1', 'editor.background']
            },
            {
                property: 'editorWhitespace.foreground',
                description: 'Color of visible whitespace characters (spaces, tabs)',
                example: 'Dots and arrows shown when whitespace rendering is enabled',
                location: 'Whitespace characters in editor',
                relatedProperties: ['editor.background', 'editor.foreground'],
                vsCodeCommand: 'editor.action.toggleRenderWhitespace'
            },
            // =================================================
            // ACTIVITY BAR ELEMENTS
            // =================================================
            {
                property: 'activityBar.background',
                description: 'Background of the leftmost vertical bar with main navigation icons',
                example: 'The narrow bar with Explorer 📁, Search 🔍, Git 🌿, and Extension 🧩 icons',
                location: 'Far left side of VS Code window',
                relatedProperties: ['activityBar.foreground', 'activityBar.activeBorder', 'activityBar.border'],
                vsCodeCommand: 'workbench.view.explorer'
            },
            {
                property: 'activityBar.foreground',
                description: 'Color of icons in the activity bar when inactive',
                example: 'Default color of Explorer, Search, Git, Extension icons when not active',
                location: 'Activity bar icons',
                relatedProperties: ['activityBar.background', 'activityBar.inactiveForeground', 'activityBarBadge.foreground']
            },
            {
                property: 'activityBar.inactiveForeground',
                description: 'Color of inactive activity bar icons (dimmed)',
                example: 'Dimmed color for icons that are not currently selected',
                location: 'Inactive activity bar icons',
                relatedProperties: ['activityBar.foreground', 'activityBar.background']
            },
            {
                property: 'activityBar.activeBorder',
                description: 'Border color for the currently active activity bar item',
                example: 'Highlight border/line around the active icon (Explorer, Git, etc.)',
                location: 'Active activity bar icon border',
                relatedProperties: ['activityBar.activeBackground', 'activityBar.foreground']
            },
            {
                property: 'activityBar.activeBackground',
                description: 'Background color for the currently active activity bar item',
                example: 'Background highlight behind the currently selected activity icon',
                location: 'Active activity bar icon background',
                relatedProperties: ['activityBar.activeBorder', 'activityBar.background']
            },
            {
                property: 'activityBarBadge.background',
                description: 'Background color of notification badges on activity bar icons',
                example: 'Red dot or number badge showing unread notifications, git changes, etc.',
                location: 'Notification badges on activity icons',
                relatedProperties: ['activityBarBadge.foreground', 'activityBar.background']
            },
            {
                property: 'activityBarBadge.foreground',
                description: 'Text color of notification badges on activity bar icons',
                example: 'Color of numbers or text inside notification badges',
                location: 'Text inside notification badges',
                relatedProperties: ['activityBarBadge.background', 'activityBar.foreground']
            },
            // =================================================
            // SIDEBAR ELEMENTS
            // =================================================
            {
                property: 'sideBar.background',
                description: 'Background of the main sidebar panels (Explorer, Search, Git, etc.)',
                example: 'The panel showing your file tree, search results, git changes',
                location: 'Main sidebar panel (next to activity bar)',
                relatedProperties: ['sideBar.foreground', 'sideBar.border', 'sideBarTitle.foreground'],
                vsCodeCommand: 'workbench.view.explorer'
            },
            {
                property: 'sideBar.foreground',
                description: 'Text color in the sidebar panels',
                example: 'File names, folder names, search results, git file names',
                location: 'Text content in sidebar panels',
                relatedProperties: ['sideBar.background', 'sideBarTitle.foreground', 'sideBarSectionHeader.foreground']
            },
            {
                property: 'sideBar.border',
                description: 'Border color of the sidebar',
                example: 'Vertical line separating sidebar from editor area',
                location: 'Right edge of sidebar',
                relatedProperties: ['sideBar.background', 'editor.background']
            },
            {
                property: 'sideBarTitle.foreground',
                description: 'Color of main sidebar panel titles',
                example: 'Text color of "EXPLORER", "SEARCH", "SOURCE CONTROL" headers',
                location: 'Main sidebar panel titles',
                relatedProperties: ['sideBar.foreground', 'sideBarSectionHeader.foreground']
            },
            {
                property: 'sideBarSectionHeader.background',
                description: 'Background color of sidebar section headers',
                example: 'Background behind "OPEN EDITORS", "FOLDERS", "OUTLINE" sections',
                location: 'Sidebar section header backgrounds',
                relatedProperties: ['sideBarSectionHeader.foreground', 'sideBar.background']
            },
            {
                property: 'sideBarSectionHeader.foreground',
                description: 'Text color of sidebar section headers',
                example: 'Text color of "OPEN EDITORS", "FOLDERS", "OUTLINE" headers',
                location: 'Sidebar section header text',
                relatedProperties: ['sideBarSectionHeader.background', 'sideBarTitle.foreground']
            },
            // =================================================
            // STATUS BAR ELEMENTS
            // =================================================
            {
                property: 'statusBar.background',
                description: 'Background of the bottom status bar',
                example: 'The bottom bar showing git branch, line numbers, language mode, errors',
                location: 'Bottom edge of VS Code window',
                relatedProperties: ['statusBar.foreground', 'statusBar.border', 'statusBarItem.hoverBackground'],
                vsCodeCommand: 'workbench.action.toggleStatusbarVisibility'
            },
            {
                property: 'statusBar.foreground',
                description: 'Text color in the status bar',
                example: 'Color of git branch name, line:column numbers, language mode text',
                location: 'Text content in status bar',
                relatedProperties: ['statusBar.background', 'statusBarItem.hoverBackground']
            },
            {
                property: 'statusBar.border',
                description: 'Top border color of the status bar',
                example: 'Horizontal line separating status bar from editor/panel area',
                location: 'Top edge of status bar',
                relatedProperties: ['statusBar.background', 'panel.border']
            },
            {
                property: 'statusBarItem.activeBackground',
                description: 'Background color of active status bar items',
                example: 'Background when a status bar item is being used/clicked',
                location: 'Active status bar items',
                relatedProperties: ['statusBarItem.hoverBackground', 'statusBar.background']
            },
            {
                property: 'statusBarItem.hoverBackground',
                description: 'Background color when hovering over status bar items',
                example: 'Highlight when you hover over git branch, language mode, etc.',
                location: 'Hovered status bar items',
                relatedProperties: ['statusBarItem.activeBackground', 'statusBar.background']
            },
            // =================================================
            // TITLE BAR ELEMENTS
            // =================================================
            {
                property: 'titleBar.activeBackground',
                description: 'Background of the window title bar when VS Code is focused',
                example: 'Top bar showing window title, file path, and window controls',
                location: 'Top of VS Code window',
                relatedProperties: ['titleBar.activeForeground', 'titleBar.inactiveBackground', 'titleBar.border']
            },
            {
                property: 'titleBar.activeForeground',
                description: 'Text color in the active title bar',
                example: 'Color of window title text, file path, and menu items',
                location: 'Title bar text and controls',
                relatedProperties: ['titleBar.activeBackground', 'titleBar.inactiveForeground']
            },
            {
                property: 'titleBar.inactiveBackground',
                description: 'Background of the title bar when VS Code is not focused',
                example: 'Title bar background when you click on another application',
                location: 'Title bar when window is inactive',
                relatedProperties: ['titleBar.inactiveForeground', 'titleBar.activeBackground']
            },
            {
                property: 'titleBar.inactiveForeground',
                description: 'Text color in the inactive title bar',
                example: 'Dimmed color of title text when VS Code is not the active window',
                location: 'Title bar text when inactive',
                relatedProperties: ['titleBar.inactiveBackground', 'titleBar.activeForeground']
            },
            {
                property: 'titleBar.border',
                description: 'Bottom border color of the title bar',
                example: 'Horizontal line separating title bar from menu/editor area',
                location: 'Bottom edge of title bar',
                relatedProperties: ['titleBar.activeBackground', 'menubar.selectionBackground']
            },
            // =================================================
            // TAB ELEMENTS
            // =================================================
            {
                property: 'tab.activeBackground',
                description: 'Background of the currently active/focused tab',
                example: 'Background of the tab for the file you\'re currently viewing/editing',
                location: 'Active file tab',
                relatedProperties: ['tab.activeForeground', 'tab.inactiveBackground', 'tab.activeBorder']
            },
            {
                property: 'tab.activeForeground',
                description: 'Text color of the active tab',
                example: 'Color of the filename text in the currently active tab',
                location: 'Active tab text',
                relatedProperties: ['tab.activeBackground', 'tab.inactiveForeground']
            },
            {
                property: 'tab.inactiveBackground',
                description: 'Background of inactive tabs (files open but not focused)',
                example: 'Background of tabs for files that are open but not currently active',
                location: 'Inactive file tabs',
                relatedProperties: ['tab.inactiveForeground', 'tab.activeBackground']
            },
            {
                property: 'tab.inactiveForeground',
                description: 'Text color of inactive tabs',
                example: 'Color of filename text in tabs that are not currently active',
                location: 'Inactive tab text',
                relatedProperties: ['tab.inactiveBackground', 'tab.activeForeground']
            },
            {
                property: 'tab.border',
                description: 'Border color around tabs',
                example: 'Outline/separator lines around individual tabs',
                location: 'Tab borders and separators',
                relatedProperties: ['tab.activeBackground', 'editorGroupHeader.tabsBackground']
            },
            {
                property: 'tab.activeBorder',
                description: 'Bottom border color of the active tab',
                example: 'Underline or border highlighting the currently active tab',
                location: 'Bottom border of active tab',
                relatedProperties: ['tab.activeBackground', 'tab.border']
            },
            {
                property: 'tab.hoverBackground',
                description: 'Background color when hovering over tabs',
                example: 'Background highlight when you hover over inactive tabs',
                location: 'Hovered tabs',
                relatedProperties: ['tab.hoverForeground', 'tab.inactiveBackground']
            },
            {
                property: 'editorGroupHeader.tabsBackground',
                description: 'Background color of the tab bar area',
                example: 'Background behind all tabs in the tab bar',
                location: 'Tab bar background',
                relatedProperties: ['tab.inactiveBackground', 'editor.background']
            },
            // =================================================
            // INPUT ELEMENTS
            // =================================================
            {
                property: 'input.background',
                description: 'Background color of input fields and text boxes',
                example: 'Background of search boxes, command palette, settings search, rename boxes',
                location: 'Input fields throughout VS Code',
                relatedProperties: ['input.foreground', 'input.border', 'input.placeholderForeground'],
                vsCodeCommand: 'workbench.action.showCommands'
            },
            {
                property: 'input.foreground',
                description: 'Text color in input fields',
                example: 'Color of text you type in search boxes, command palette, and other inputs',
                location: 'Text inside input fields',
                relatedProperties: ['input.background', 'input.placeholderForeground']
            },
            {
                property: 'input.border',
                description: 'Border color around input fields',
                example: 'Outline around search boxes, command palette, and text inputs',
                location: 'Input field borders',
                relatedProperties: ['input.background', 'focusBorder']
            },
            {
                property: 'input.placeholderForeground',
                description: 'Color of placeholder text in input fields',
                example: 'Color of hint text like "Search files by name" before you start typing',
                location: 'Placeholder text in inputs',
                relatedProperties: ['input.foreground', 'input.background']
            },
            {
                property: 'inputOption.activeBackground',
                description: 'Background of active input options (like search filters)',
                example: 'Background of active toggle buttons in search (case sensitive, regex, etc.)',
                location: 'Active input option buttons',
                relatedProperties: ['inputOption.activeForeground', 'input.background']
            },
            // =================================================
            // BUTTON ELEMENTS
            // =================================================
            {
                property: 'button.background',
                description: 'Background color of primary action buttons',
                example: 'Background of main action buttons in dialogs, notifications, and forms',
                location: 'Primary buttons throughout VS Code',
                relatedProperties: ['button.foreground', 'button.hoverBackground']
            },
            {
                property: 'button.foreground',
                description: 'Text color of primary buttons',
                example: 'Color of text on action buttons like "Install", "Save", "Open"',
                location: 'Primary button text',
                relatedProperties: ['button.background', 'button.secondaryForeground']
            },
            {
                property: 'button.hoverBackground',
                description: 'Background color of buttons when hovered',
                example: 'Background of buttons when you hover your mouse over them',
                location: 'Hovered primary buttons',
                relatedProperties: ['button.background', 'button.foreground']
            },
            {
                property: 'button.secondaryBackground',
                description: 'Background color of secondary buttons',
                example: 'Background of less prominent buttons like "Cancel", "Later"',
                location: 'Secondary buttons',
                relatedProperties: ['button.secondaryForeground', 'button.secondaryHoverBackground']
            },
            {
                property: 'button.secondaryForeground',
                description: 'Text color of secondary buttons',
                example: 'Text color on secondary action buttons',
                location: 'Secondary button text',
                relatedProperties: ['button.secondaryBackground', 'button.foreground']
            },
            {
                property: 'button.secondaryHoverBackground',
                description: 'Background color of secondary buttons when hovered',
                example: 'Background of secondary buttons when you hover over them',
                location: 'Hovered secondary buttons',
                relatedProperties: ['button.secondaryBackground', 'button.hoverBackground']
            },
            // =================================================
            // LIST ELEMENTS
            // =================================================
            {
                property: 'list.activeSelectionBackground',
                description: 'Background of selected items in lists when the list is focused',
                example: 'Background of selected file in Explorer, selected search result, selected git file',
                location: 'Selected items in focused lists',
                relatedProperties: ['list.activeSelectionForeground', 'list.inactiveSelectionBackground'],
                vsCodeCommand: 'workbench.view.explorer'
            },
            {
                property: 'list.activeSelectionForeground',
                description: 'Text color of selected items in focused lists',
                example: 'Text color of selected file names, search results when list has focus',
                location: 'Selected item text in focused lists',
                relatedProperties: ['list.activeSelectionBackground', 'list.foreground']
            },
            {
                property: 'list.inactiveSelectionBackground',
                description: 'Background of selected items when list is not focused',
                example: 'Background of selected items when you click elsewhere but selection remains',
                location: 'Selected items in unfocused lists',
                relatedProperties: ['list.inactiveSelectionForeground', 'list.activeSelectionBackground']
            },
            {
                property: 'list.inactiveSelectionForeground',
                description: 'Text color of selected items in unfocused lists',
                example: 'Text color of selected items when list doesn\'t have focus',
                location: 'Selected item text in unfocused lists',
                relatedProperties: ['list.inactiveSelectionBackground', 'list.activeSelectionForeground']
            },
            {
                property: 'list.hoverBackground',
                description: 'Background color when hovering over list items',
                example: 'Background highlight when you hover over files in Explorer, search results',
                location: 'Hovered list items',
                relatedProperties: ['list.hoverForeground', 'list.activeSelectionBackground']
            },
            {
                property: 'list.hoverForeground',
                description: 'Text color when hovering over list items',
                example: 'Text color of items when you hover over them',
                location: 'Hovered list item text',
                relatedProperties: ['list.hoverBackground', 'list.foreground']
            },
            {
                property: 'list.foreground',
                description: 'Default text color for items in lists',
                example: 'Default color of file names, folder names in Explorer and other lists',
                location: 'List item text',
                relatedProperties: ['list.activeSelectionForeground', 'sideBar.foreground']
            },
            // =================================================
            // DROPDOWN ELEMENTS
            // =================================================
            {
                property: 'dropdown.background',
                description: 'Background color of dropdown menus',
                example: 'Background of dropdown lists like language selector, theme picker',
                location: 'Dropdown menu backgrounds',
                relatedProperties: ['dropdown.foreground', 'dropdown.border']
            },
            {
                property: 'dropdown.foreground',
                description: 'Text color in dropdown menus',
                example: 'Color of text in dropdown options and selections',
                location: 'Dropdown menu text',
                relatedProperties: ['dropdown.background', 'list.foreground']
            },
            {
                property: 'dropdown.border',
                description: 'Border color around dropdown menus',
                example: 'Outline around dropdown menus when they\'re open',
                location: 'Dropdown menu borders',
                relatedProperties: ['dropdown.background', 'widget.border']
            },
            // =================================================
            // PANEL ELEMENTS
            // =================================================
            {
                property: 'panel.background',
                description: 'Background of bottom panels (Terminal, Output, Debug Console)',
                example: 'Background of the bottom panel area containing terminal, problems, output',
                location: 'Bottom panel area',
                relatedProperties: ['panel.border', 'panelTitle.activeForeground'],
                vsCodeCommand: 'workbench.action.terminal.toggleTerminal'
            },
            {
                property: 'panel.border',
                description: 'Border color of the panel area',
                example: 'Top border separating bottom panels from editor area',
                location: 'Panel borders and separators',
                relatedProperties: ['panel.background', 'statusBar.border']
            },
            {
                property: 'panelTitle.activeForeground',
                description: 'Text color of the active panel tab',
                example: 'Color of active tab text like "TERMINAL", "OUTPUT", "PROBLEMS"',
                location: 'Active panel tab text',
                relatedProperties: ['panelTitle.inactiveForeground', 'panel.background']
            },
            {
                property: 'panelTitle.inactiveForeground',
                description: 'Text color of inactive panel tabs',
                example: 'Color of non-active panel tabs in the bottom panel',
                location: 'Inactive panel tab text',
                relatedProperties: ['panelTitle.activeForeground', 'panel.background']
            },
            // =================================================
            // TERMINAL ELEMENTS
            // =================================================
            {
                property: 'terminal.background',
                description: 'Background color of the integrated terminal',
                example: 'Background behind terminal text and commands',
                location: 'Terminal panel background',
                relatedProperties: ['terminal.foreground', 'panel.background'],
                vsCodeCommand: 'workbench.action.terminal.toggleTerminal'
            },
            {
                property: 'terminal.foreground',
                description: 'Default text color in the terminal',
                example: 'Color of regular terminal text and command output',
                location: 'Terminal text',
                relatedProperties: ['terminal.background', 'terminal.ansiWhite']
            },
            {
                property: 'terminal.ansiBlack',
                description: 'Black color in terminal color palette',
                example: 'Terminal black color used by command line applications',
                location: 'Terminal black text',
                relatedProperties: ['terminal.ansiWhite', 'terminal.foreground']
            },
            {
                property: 'terminal.ansiRed',
                description: 'Red color in terminal color palette',
                example: 'Terminal red color for errors, warnings, and red text',
                location: 'Terminal red text',
                relatedProperties: ['terminal.ansiGreen', 'terminal.foreground']
            },
            {
                property: 'terminal.ansiGreen',
                description: 'Green color in terminal color palette',
                example: 'Terminal green color for success messages and green text',
                location: 'Terminal green text',
                relatedProperties: ['terminal.ansiRed', 'terminal.ansiYellow']
            },
            {
                property: 'terminal.ansiYellow',
                description: 'Yellow color in terminal color palette',
                example: 'Terminal yellow color for warnings and highlighted text',
                location: 'Terminal yellow text',
                relatedProperties: ['terminal.ansiGreen', 'terminal.ansiBlue']
            },
            {
                property: 'terminal.ansiBlue',
                description: 'Blue color in terminal color palette',
                example: 'Terminal blue color for information and blue text',
                location: 'Terminal blue text',
                relatedProperties: ['terminal.ansiYellow', 'terminal.ansiMagenta']
            },
            {
                property: 'terminal.ansiMagenta',
                description: 'Magenta color in terminal color palette',
                example: 'Terminal magenta/purple color for special text',
                location: 'Terminal magenta text',
                relatedProperties: ['terminal.ansiBlue', 'terminal.ansiCyan']
            },
            {
                property: 'terminal.ansiCyan',
                description: 'Cyan color in terminal color palette',
                example: 'Terminal cyan color for special highlighting',
                location: 'Terminal cyan text',
                relatedProperties: ['terminal.ansiMagenta', 'terminal.ansiWhite']
            },
            {
                property: 'terminal.ansiWhite',
                description: 'White color in terminal color palette',
                example: 'Terminal white color for bright text',
                location: 'Terminal white text',
                relatedProperties: ['terminal.ansiBlack', 'terminal.foreground']
            },
            // =================================================
            // NOTIFICATION ELEMENTS
            // =================================================
            {
                property: 'notificationCenter.border',
                description: 'Border color of the notification center',
                example: 'Border around the notification center panel',
                location: 'Notification center borders',
                relatedProperties: ['notifications.background', 'widget.border']
            },
            {
                property: 'notifications.background',
                description: 'Background color of notifications',
                example: 'Background of popup notifications and notification center',
                location: 'Notification backgrounds',
                relatedProperties: ['notifications.foreground', 'notificationCenter.border']
            },
            {
                property: 'notifications.foreground',
                description: 'Text color in notifications',
                example: 'Color of notification message text',
                location: 'Notification text',
                relatedProperties: ['notifications.background', 'button.foreground']
            },
            // =================================================
            // WIDGET ELEMENTS
            // =================================================
            {
                property: 'widget.shadow',
                description: 'Shadow color for floating widgets and panels',
                example: 'Drop shadow behind popup menus, suggestions, and floating panels',
                location: 'Widget shadows',
                relatedProperties: ['widget.border', 'dropdown.background']
            },
            {
                property: 'widget.border',
                description: 'Border color for widgets',
                example: 'Border around suggestion boxes, hover tooltips, and popup widgets',
                location: 'Widget borders',
                relatedProperties: ['widget.shadow', 'input.border']
            }
        ];
        elements.forEach(element => {
            this.elementDatabase.set(element.property, element);
        });
    }
    // =================================================
    // UTILITY METHODS FOR ENHANCED NAVIGATION
    // =================================================
    static searchElements(query) {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        const results = [];
        const searchTerm = query.toLowerCase();
        this.elementDatabase.forEach((element) => {
            // Search in property name, description, example, and location
            const searchFields = [
                element.property,
                element.description,
                element.example,
                element.location,
                ...(element.relatedProperties || [])
            ].join(' ').toLowerCase();
            if (searchFields.includes(searchTerm)) {
                results.push(element);
            }
        });
        return results;
    }
    static getElementsByCategory(category) {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        const results = [];
        const categoryLower = category.toLowerCase();
        this.elementDatabase.forEach((element) => {
            if (element.property.toLowerCase().includes(categoryLower)) {
                results.push(element);
            }
        });
        return results;
    }
    static getRelatedElements(property) {
        const element = this.getElementInfo(property);
        if (!element || !element.relatedProperties) {
            return [];
        }
        const related = [];
        element.relatedProperties.forEach(relatedProp => {
            const relatedElement = this.elementDatabase.get(relatedProp);
            if (relatedElement) {
                related.push(relatedElement);
            }
        });
        return related;
    }
    static getAllCategories() {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        const categories = new Set();
        this.elementDatabase.forEach((element) => {
            // Extract category from property name (e.g., "editor", "activityBar", etc.)
            const parts = element.property.split('.');
            if (parts.length > 1) {
                categories.add(parts[0]);
            }
        });
        return Array.from(categories).sort();
    }
    static getAllElements() {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        return Array.from(this.elementDatabase.values());
    }
    static getElementCount() {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        return this.elementDatabase.size;
    }
    static generateDemoTheme(baseColor) {
        const demo = { colors: {} };
        // Generate variations of the base color
        const variations = this.generateColorVariations(baseColor);
        // Apply colors to major elements
        demo.colors['editor.background'] = variations.background;
        demo.colors['editor.foreground'] = variations.foreground;
        demo.colors['activityBar.background'] = variations.darker;
        demo.colors['sideBar.background'] = variations.medium;
        demo.colors['statusBar.background'] = variations.accent;
        demo.colors['titleBar.activeBackground'] = variations.darker;
        demo.colors['tab.activeBackground'] = variations.background;
        demo.colors['tab.inactiveBackground'] = variations.medium;
        demo.colors['panel.background'] = variations.medium;
        demo.colors['terminal.background'] = variations.darker;
        return demo;
    }
    static generateColorVariations(baseColor) {
        // Simple color variation logic (can be enhanced)
        return {
            background: baseColor,
            foreground: '#ffffff',
            darker: this.adjustBrightness(baseColor, -20),
            medium: this.adjustBrightness(baseColor, -10),
            lighter: this.adjustBrightness(baseColor, 10),
            accent: this.adjustBrightness(baseColor, 15)
        };
    }
    static adjustBrightness(color, percent) {
        // Simple brightness adjustment (can be enhanced with proper color libraries)
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const adjust = (value) => {
            const adjusted = value + (percent / 100) * 255;
            return Math.max(0, Math.min(255, Math.round(adjusted)));
        };
        const newR = adjust(r).toString(16).padStart(2, '0');
        const newG = adjust(g).toString(16).padStart(2, '0');
        const newB = adjust(b).toString(16).padStart(2, '0');
        return `#${newR}${newG}${newB}`;
    }
    static async navigateToElement(property) {
        const elementInfo = this.getElementInfo(property);
        if (elementInfo.vsCodeCommand) {
            try {
                await vscode.commands.executeCommand(elementInfo.vsCodeCommand);
                vscode.window.showInformationMessage(`Navigated to show: ${property}. Look for the element described as "${elementInfo.example}"`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Could not navigate: ${error}`);
            }
        }
        else {
            // Show information about where to find the element
            const action = await vscode.window.showInformationMessage(`${property} is located: ${elementInfo.location}. ${elementInfo.example}`, 'Open Settings', 'Show Command Palette');
            if (action === 'Open Settings') {
                await vscode.commands.executeCommand('workbench.action.openSettings');
            }
            else if (action === 'Show Command Palette') {
                await vscode.commands.executeCommand('workbench.action.showCommands');
            }
        }
    }
    static async showInSettings(property) {
        try {
            await vscode.commands.executeCommand('workbench.action.openSettings', property);
        }
        catch (error) {
            await vscode.commands.executeCommand('workbench.action.openSettings');
            vscode.window.showInformationMessage(`Search for "${property}" in the settings`);
        }
    }
    static async testColorOnElement(property, color) {
        // Temporarily apply the color to test it
        const config = vscode.workspace.getConfiguration();
        const workbenchConfig = config.get('workbench.colorCustomizations') || {};
        // Store original value
        const originalValue = workbenchConfig[property];
        // Apply test color
        workbenchConfig[property] = color;
        await config.update('workbench.colorCustomizations', workbenchConfig, vscode.ConfigurationTarget.Global);
        const action = await vscode.window.showInformationMessage(`Testing ${property} with color ${color}. Do you want to keep this change?`, 'Keep', 'Revert');
        if (action === 'Revert') {
            // Restore original value
            if (originalValue) {
                workbenchConfig[property] = originalValue;
            }
            else {
                delete workbenchConfig[property];
            }
            await config.update('workbench.colorCustomizations', workbenchConfig, vscode.ConfigurationTarget.Global);
        }
    }
    static getExamplesHtml(elementInfo) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Element: ${elementInfo.property}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .property-name {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            font-family: var(--vscode-editor-font-family);
        }
        .description {
            font-size: 1.1em;
            margin-top: 10px;
            opacity: 0.9;
        }
        .section {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .section-title {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .example-text {
            font-style: italic;
            margin: 10px 0;
        }
        .location {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.9em;
            display: inline-block;
            margin: 5px 0;
        }
        .demo-code {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            padding: 15px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            margin: 10px 0;
            overflow-x: auto;
        }
        .related-properties {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }
        .related-prop {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            cursor: pointer;
            border: none;
        }
        .related-prop:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .color-test {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 15px 0;
        }
        .color-input {
            width: 40px;
            height: 30px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            cursor: pointer;
        }
        .visual-example {
            border: 2px solid var(--vscode-widget-border);
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            background-color: var(--vscode-input-background);
        }
        .highlight {
            background-color: var(--vscode-textLink-activeForeground);
            color: var(--vscode-textLink-background);
            padding: 2px 4px;
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="property-name">${elementInfo.property}</div>
            <div class="description">${elementInfo.description}</div>
        </div>

        <div class="section">
            <div class="section-title">📍 Where to Find This Element</div>
            <div class="location">${elementInfo.location}</div>
            <div class="example-text">"${elementInfo.example}"</div>
        </div>

        ${elementInfo.demoCode ? `
        <div class="section">
            <div class="section-title">💻 Code Example</div>
            <div class="demo-code">${elementInfo.demoCode}</div>
            <p><em>The ${elementInfo.property} property affects the appearance of this code area.</em></p>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">🎨 Test This Element</div>
            <div class="color-test">
                <input type="color" class="color-input" id="colorPicker" value="#007acc" />
                <button class="btn" onclick="testColor()">Test Color</button>
                <span>Try different colors to see how they affect this element</span>
            </div>
        </div>

        ${elementInfo.relatedProperties && elementInfo.relatedProperties.length > 0 ? `
        <div class="section">
            <div class="section-title">🔗 Related Properties</div>
            <p>These properties work together with <span class="highlight">${elementInfo.property}</span>:</p>
            <div class="related-properties">
                ${elementInfo.relatedProperties.map(prop => `<button class="related-prop" onclick="openRelated('${prop}')">${prop}</button>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="visual-example">
            <div class="section-title">🔍 Visual Guide</div>
            <p>This property controls: <strong>${elementInfo.example}</strong></p>
            <p>Location: <strong>${elementInfo.location}</strong></p>
            ${elementInfo.property.includes('background') ?
            '<p>💡 <strong>Tip:</strong> This is a background color property - it affects the area behind text or content.</p>' :
            elementInfo.property.includes('foreground') ?
                '<p>💡 <strong>Tip:</strong> This is a foreground color property - it affects text or icon colors.</p>' :
                '<p>💡 <strong>Tip:</strong> This property affects the visual appearance of UI elements.</p>'}
        </div>

        <div class="actions">
            <button class="btn" onclick="navigateToElement()">
                🧭 Show in VS Code
            </button>
            <button class="btn btn-secondary" onclick="showInSettings()">
                ⚙️ Open in Settings
            </button>
            <button class="btn btn-secondary" onclick="copyProperty()">
                📋 Copy Property Name
            </button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const property = '${elementInfo.property}';

        function navigateToElement() {
            vscode.postMessage({ 
                command: 'navigateToElement', 
                property: property 
            });
        }

        function showInSettings() {
            vscode.postMessage({ 
                command: 'showInSettings', 
                property: property 
            });
        }

        function copyProperty() {
            vscode.postMessage({ 
                command: 'copyProperty', 
                property: property 
            });
        }

        function openRelated(relatedProperty) {
            vscode.postMessage({ 
                command: 'openRelated', 
                relatedProperty: relatedProperty 
            });
        }

        function testColor() {
            const colorPicker = document.getElementById('colorPicker');
            vscode.postMessage({ 
                command: 'testColor', 
                property: property,
                color: colorPicker.value
            });
        }
    </script>
</body>
</html>`;
    }
}
exports.NavigationProvider = NavigationProvider;
NavigationProvider.elementDatabase = new Map();
//# sourceMappingURL=navigationProvider.js.map