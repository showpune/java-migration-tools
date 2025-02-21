import * as vscode from "vscode";
import { registerChatTools } from "./tools";

export async function activate(context: vscode.ExtensionContext) {
  registerChatTools(context);
}

export function deactivate() {}
