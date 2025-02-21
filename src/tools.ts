import * as vscode from 'vscode';

export function registerChatTools(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.lm.registerTool('edit-tools-migration-guideline', new IMigrateGuidelineTool()));
	context.subscriptions.push(vscode.lm.registerTool('chat-tools-sample_findFiles', new FindFilesTool()));
	context.subscriptions.push(vscode.lm.registerTool('chat-tools-sample_runInTerminal', new RunInTerminalTool()));
}

interface IMigrateGuidelineParameters {
	migrateScenario: string;
	from: string;
	to: string;
}

export class IMigrateGuidelineTool implements vscode.LanguageModelTool<IMigrateGuidelineParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IMigrateGuidelineParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input as IMigrateGuidelineParameters;
		const scenario = params.migrateScenario;
		const from = params.from;
		const to = params.to;
		const guideline =
		'# Migration Guideline for ${scenario} \n' +
		`1) Update the dependency files: Find the java dependency file in the project, include the pom.xml or gradle settings, update the dependency for scenario ${scenario} from ${from} to ${to}\n ` +
		`2) Update the Java Code: Search the java code in the whole project if any code is using the API from ${from}, if yes, replace it with ${to} \n ` +
		`3) Update the configuration code:  Check the configuration files in the project, normally it is properties/yaml/yml files, check if it is still using the configuration of ${from}, if yes, replace it with the configuration of ${to}  \n ` +
		'4) Update the test cases: Check the test cases in the project, if any test case is using the API from ${from}, replace it with ${to} \n ' +
		'5) Try the above steps multiple time and make sure all the code related with  ${from} \n  is changed to ${to}' +
		'6) Compile the code and fix the build error \n ';
		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(guideline)]);
	}
}

interface IFindFilesParameters {
	pattern: string;
}

export class FindFilesTool implements vscode.LanguageModelTool<IFindFilesParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IFindFilesParameters>,
		token: vscode.CancellationToken
	) {
		const params = options.input as IFindFilesParameters;
		const files = await vscode.workspace.findFiles(
			params.pattern,
			'**/node_modules/**',
			undefined,
			token
		);

		const strFiles = files.map((f) => f.fsPath).join('\n');
		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(`Found ${files.length} files matching "${params.pattern}":\n${strFiles}`)]);
	}

	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IFindFilesParameters>,
		_token: vscode.CancellationToken
	) {
		return {
			invocationMessage: `Searching workspace for "${options.input.pattern}"`,
		};
	}
}

interface IRunInTerminalParameters {
	command: string;
}

async function waitForShellIntegration(
	terminal: vscode.Terminal,
	timeout: number
): Promise<void> {
	let resolve: () => void;
	let reject: (e: Error) => void;
	const p = new Promise<void>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	const timer = setTimeout(() => reject(new Error('Could not run terminal command: shell integration is not enabled')), timeout);

	const listener = vscode.window.onDidChangeTerminalShellIntegration((e) => {
		if (e.terminal === terminal) {
			clearTimeout(timer);
			listener.dispose();
			resolve();
		}
	});

	await p;
}

export class RunInTerminalTool
	implements vscode.LanguageModelTool<IRunInTerminalParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IRunInTerminalParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input as IRunInTerminalParameters;

		const terminal = vscode.window.createTerminal('Language Model Tool User');
		terminal.show();
		try {
			await waitForShellIntegration(terminal, 5000);
		} catch (e) {
			return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart((e as Error).message)]);
		}

		const execution = terminal.shellIntegration!.executeCommand(params.command);
		const terminalStream = execution.read();

		let terminalResult = '';
		for await (const chunk of terminalStream) {
			terminalResult += chunk;
		}

		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(terminalResult)]);
	}

	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IRunInTerminalParameters>,
		_token: vscode.CancellationToken
	) {
		const confirmationMessages = {
			title: 'Run command in terminal',
			message: new vscode.MarkdownString(
				`Run this command in a terminal?` +
				`\n\n\`\`\`\n${options.input.command}\n\`\`\`\n`
			),
		};

		return {
			invocationMessage: `Running command in terminal`,
			confirmationMessages,
		};
	}
}
