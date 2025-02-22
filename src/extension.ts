// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import HoverProvider from './hoverProvider'; 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vmcode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vmcode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vmcode!');
	});

	context.subscriptions.push(disposable);
	// 创建 HoverProvider 实例
	const hoverProvider = new HoverProvider();

	// 注册 HoverProvider 到 'asm' 语言
	const asmHoverProviderDisposable = vscode.languages.registerHoverProvider('asm', hoverProvider);
  
	// 将 HoverProvider 的 Disposable 添加到上下文的 subscriptions 中
	// 这样可以确保在扩展被禁用或卸载时，HoverProvider 也会被正确地处理
	context.subscriptions.push(asmHoverProviderDisposable);

	// 注册 HoverProvider 到 'h' 语言
	const asmHoverProviderDisposable1 = vscode.languages.registerHoverProvider('cpp', hoverProvider);
  
	// 将 HoverProvider 的 Disposable 添加到上下文的 subscriptions 中
	// 这样可以确保在扩展被禁用或卸载时，HoverProvider 也会被正确地处理
	context.subscriptions.push(asmHoverProviderDisposable1);
  
}

// This method is called when your extension is deactivated
export function deactivate() {}
