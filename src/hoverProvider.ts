import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class InstructionData {
  constructor(
    public line: number,
    public pc: string,
    public inpc: string,
    public instruction: string
  ) {}
}

export default class HoverProvider implements vscode.HoverProvider {
    private data: Map<string, InstructionData> = new Map();
    private decorationType: vscode.TextEditorDecorationType;
    private curExecMcodePath = "";
  
    constructor() {
      this.loadDataBasedOnActiveDocument();
  
      // 监听文档变化事件，以便在打开新的 ASM 文件时重新加载数据
      vscode.window.onDidChangeActiveTextEditor(editor => {
          this.loadDataBasedOnActiveDocument();
      });

      // 监听文本编辑器的鼠标移动事件
    vscode.window.onDidChangeTextEditorSelection(event => {
        this.updateDecorations();
    });

    // 监听文件变化
    fs.watch(this.curExecMcodePath, (eventType, filename) => {
      if (!filename) {
         return;
      }
      
      if (eventType === 'rename' && !fs.existsSync(this.curExecMcodePath))
      {
        this.clearMcodeData();
      } else if (eventType === 'change' || (eventType === 'rename' && fs.existsSync(this.curExecMcodePath))) {
        // 添加或者修改则更新data
        this.updateMcodeData(this.curExecMcodePath);
      }
    });

      // 创建装饰器类型
      this.decorationType = vscode.window.createTextEditorDecorationType({
        // 设置装饰器的样式，这里我们设置它为透明文本
        light: {
            after: {
                color: 'rgba(0, 0, 0, 0.3)', // 半透明黑色
                fontStyle: 'italic',
                margin: '0 0 0 10px'
            }
        },
        dark: {
            after: {
                color: 'rgba(255, 255, 255, 0.5)', // 半透明白色
                fontStyle: 'italic',
                margin: '0 0 0 10px'
            }
        }
      });
    }
    
    private updateMcodeData(execMcodePath: string) {
      // 读取并解析 exec_mcode.txt 文件
      const lines = fs.readFileSync(execMcodePath, 'utf8').split('\n');
      for (const line of lines)
      {
        const [lineNumber, pc, inpc, instruction] = line.trim().split(', ');
        if (lineNumber)
        {
          const key = lineNumber;
          if (!this.data.has(key)) 
          {
            // 如果Map中没有这个lineNumber，就创建一个新的InstructionData对象
            this.data.set(key, new InstructionData(parseInt(lineNumber), pc, inpc, instruction));
          } 
          else
          {
            const existingData = this.data.get(key)!;
            existingData.pc = existingData.pc + ', ' + pc;
            existingData.inpc = existingData.inpc + ', ' + inpc;
          }
        }
      }
    }

    private clearMcodeData() {
      // 删除文件清空data
      this.data.clear();
    }

    private async loadDataBasedOnActiveDocument() {
      const editor = vscode.window.activeTextEditor;
      this.clearMcodeData();
      if (!editor) 
      {
        return; // 没有活动的编辑器
      }
      
      if (!this.isMcodeFile(editor.document)) 
      {
        editor.setDecorations(this.decorationType, []);
        return; // 不是 mcode 文件
      }
  
      const asmFilePath = editor.document.uri.fsPath;
      const baseName = path.basename(editor.document.fileName).replace(/\./g, '_') + '.txt';
      const execMcodePath = path.join(path.dirname(asmFilePath), '../..', 'tool/line_pc', baseName);
      this.curExecMcodePath = execMcodePath;
      
      if(!fs.existsSync(execMcodePath))
      {
        return;
      }
  
      this.updateMcodeData(execMcodePath);
    }
  
    private isAsmFile(document: vscode.TextDocument): boolean {
      return document.languageId === 'asm' && path.extname(document.fileName) === '.asm';
    }

    private isAsmHeaderFile(document: vscode.TextDocument): boolean {
      return path.extname(document.fileName) === '.h' && document.fileName.includes('\\mcode\\');
    }

    private isMcodeFile(document: vscode.TextDocument): boolean {
      return this.isAsmFile(document) || this.isAsmHeaderFile(document);
    }

    public provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
      if (!this.isMcodeFile(document)) 
      {
        return; // 没有活动的编辑器或者不是 mcode 文件
      }
      const lineNumber = position.line + 1; // Convert to 1-based
      const key = lineNumber.toString();
    
      const instructionData = this.data.get(key);
      if (!instructionData) {
        return null;
      }
    
      const hoverContent = new vscode.MarkdownString(`
       
        PC:    ${instructionData.pc}
        INPC:  ${instructionData.inpc}
        INS:   ${instructionData.instruction}
        
    ` );

    return new vscode.Hover(hoverContent);
  }

  private updateDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const lineNumber = editor.selection.start.line;
    const key = (lineNumber + 1).toString();

    // 清除之前的装饰器
    editor.setDecorations(this.decorationType, []);
    const instructionData = this.data.get(key);
    if (!instructionData) {
      return null;
    }
    
    const range = new vscode.Range(lineNumber, document.lineAt(lineNumber).text.length, lineNumber, document.lineAt(lineNumber).text.length);
    const pc = instructionData.pc;
    const annotationText = 'Line: ' + `${lineNumber + 1} ` + 'pc: ' + `${pc}`;
     
    const decorationOptions: vscode.DecorationOptions = {
      range,
      renderOptions: {
        after: {
          contentText: ` [${annotationText}]`,
          color: 'rgba(0, 0, 0, 0.5)',
        }
      }
    };

    editor.setDecorations(this.decorationType, [decorationOptions]);
}
}
