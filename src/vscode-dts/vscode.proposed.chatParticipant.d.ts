/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'vscode' {

	// TODO@API name: Turn?
	export class ChatRequestTurn {

		/**
		 * The prompt as entered by the user.
		 *
		 * Information about variables used in this request are is stored in {@link ChatRequest.variables}.
		 *
		 * *Note* that the {@link ChatParticipant.name name} of the participant and the {@link ChatCommand.name command}
		 * are not part of the prompt.
		 */
		readonly prompt: string;

		/**
		 * The name of the chat participant and contributing extension to which this request was directed.
		 */
		readonly participant: { readonly extensionId: string; readonly participant: string };

		/**
		 * The name of the {@link ChatCommand command} that was selected for this request.
		 */
		readonly command: string | undefined;

		/**
		 * The variables that were referenced in this message.
		 */
		readonly variables: ChatResolvedVariable[];

		private constructor(prompt: string, command: string | undefined, variables: ChatResolvedVariable[], participant: { extensionId: string; participant: string });
	}

	// TODO@API name: Turn?
	export class ChatResponseTurn {

		/**
		 * The content that was received from the chat participant. Only the progress parts that represent actual content (not metadata) are represented.
		 */
		readonly response: ReadonlyArray<ChatResponseTextPart | ChatResponseMarkdownPart | ChatResponseFileTreePart | ChatResponseAnchorPart | ChatResponseCommandButtonPart>;

		/**
		 * The result that was received from the chat participant.
		 */
		readonly result: ChatResult;

		/**
		 * The name of the chat participant and contributing extension to which this request was directed.
		 */
		readonly participant: { readonly extensionId: string; readonly participant: string };

		readonly command?: string;

		private constructor(response: ReadonlyArray<ChatResponseTextPart | ChatResponseMarkdownPart | ChatResponseFileTreePart | ChatResponseAnchorPart | ChatResponseCommandButtonPart>, result: ChatResult, participant: { extensionId: string; participant: string });
	}

	export interface ChatContext {
		/**
		 * All of the chat messages so far in the current chat session.
		 */
		readonly history: ReadonlyArray<ChatRequestTurn | ChatResponseTurn>;
	}

	/**
	 * Represents an error result from a chat request.
	 */
	export interface ChatErrorDetails {
		/**
		 * An error message that is shown to the user.
		 */
		message: string;

		/**
		 * If partial markdown content was sent over the `progress` callback before the response terminated, then this flag
		 * can be set to true and it will be rendered with incomplete markdown features patched up.
		 *
		 * For example, if the response terminated after sending part of a triple-backtick code block, then the editor will
		 * render it as a complete code block.
		 */
		responseIsIncomplete?: boolean;

		/**
		 * If set to true, the response will be partly blurred out.
		 */
		responseIsFiltered?: boolean;
	}

	/**
	 * The result of a chat request.
	 */
	export interface ChatResult {
		/**
		 * If the request resulted in an error, this property defines the error details.
		 */
		errorDetails?: ChatErrorDetails;

		/**
		 * Arbitrary metadata for this result. Can be anything but must be JSON-stringifyable.
		 */
		readonly metadata?: { readonly [key: string]: any };
	}

	/**
	 * Represents the type of user feedback received.
	 */
	export enum ChatResultFeedbackKind {
		/**
		 * The user marked the result as helpful.
		 */
		Unhelpful = 0,

		/**
		 * The user marked the result as unhelpful.
		 */
		Helpful = 1,
	}

	/**
	 * Represents user feedback for a result.
	 */
	export interface ChatResultFeedback {
		/**
		 * This instance of ChatResult has the same properties as the result returned from the participant callback, including `metadata`, but is not the same instance.
		 */
		readonly result: ChatResult;

		/**
		 * The kind of feedback that was received.
		 */
		readonly kind: ChatResultFeedbackKind;
	}

	export interface ChatCommand {
		/**
		 * A short name by which this command is referred to in the UI, e.g. `fix` or
		 * `explain` for commands that fix an issue or explain code.
		 *
		 * **Note**: The name should be unique among the commands provided by this participant.
		 */
		readonly name: string;

		/**
		 * Human-readable description explaining what this command does.
		 */
		readonly description: string;

		/**
		 * When the user clicks this command in `/help`, this text will be submitted to this command
		 */
		readonly sampleRequest?: string;

		/**
		 * Whether executing the command puts the chat into a persistent mode, where the command is automatically added to the chat input for the next message.
		 */
		readonly isSticky?: boolean;
	}

	export interface ChatCommandProvider {

		/**
		 * Returns a list of commands that its participant is capable of handling. A command
		 * can be selected by the user and will then be passed to the {@link ChatRequestHandler handler}
		 * via the {@link ChatRequest.command command} property.
		 *
		 *
		 * @param token A cancellation token.
		 * @returns A list of commands. The lack of a result can be signaled by returning `undefined`, `null`, or
		 * an empty array.
		 */
		// TODO@API Q: should we provide the current history or last results for extra context?
		provideCommands(token: CancellationToken): ProviderResult<ChatCommand[]>;
	}

	/**
	 * A followup question suggested by the model.
	 */
	export interface ChatFollowup {
		/**
		 * The message to send to the chat.
		 */
		prompt: string;

		/**
		 * By default, the followup goes to the same participant/command. But this property can be set to invoke a different participant.
		 * TODO@API do extensions need to specify the extensionID of the participant here as well?
		 */
		participant?: string;

		/**
		 * By default, the followup goes to the same participant/command. But this property can be set to invoke a different command.
		 */
		command?: string;

		/**
		 * A tooltip to show when hovering over the followup.
		 */
		tooltip?: string;

		/**
		 * A title to show the user, when it is different than the message.
		 */
		// TODO@API title vs tooltip?
		title?: string;
	}

	/**
	 * Will be invoked once after each request to get suggested followup questions to show the user. The user can click the followup to send it to the chat.
	 */
	export interface ChatFollowupProvider {
		/**
		 *
		 * @param result The same instance of the result object that was returned by the chat participant, and it can be extended with arbitrary properties if needed.
		 * @param token A cancellation token.
		 */
		provideFollowups(result: ChatResult, token: CancellationToken): ProviderResult<ChatFollowup[]>;
	}

	/**
	 * A chat request handler is a callback that will be invoked when a request is made to a chat participant.
	 */
	export type ChatRequestHandler = (request: ChatRequest, context: ChatContext, response: ChatResponseStream, token: CancellationToken) => ProviderResult<ChatResult>;


	export interface ChatParticipant {

		/**
		 * The short name by which this participant is referred to in the UI, e.g `workspace`.
		 */
		readonly name: string;

		/**
		 * The full name of this participant.
		 */
		fullName: string;

		/**
		 * A human-readable description explaining what this participant does.
		 */
		description: string;

		/**
		 * Icon for the participant shown in UI.
		 */
		iconPath?: Uri | {
			/**
			 * The icon path for the light theme.
			 */
			light: Uri;
			/**
			 * The icon path for the dark theme.
			 */
			dark: Uri;
		} | ThemeIcon;

		/**
		 * The handler for requests to this participant.
		 */
		requestHandler: ChatRequestHandler;

		/**
		 * This provider will be called to retrieve the participant's commands.
		 */
		commandProvider?: ChatCommandProvider;

		/**
		 * This provider will be called once after each request to retrieve suggested followup questions.
		 */
		followupProvider?: ChatFollowupProvider;

		/**
		 * When the user clicks this participant in `/help`, this text will be submitted to this command
		 */
		sampleRequest?: string;

		/**
		 * Whether invoking the participant puts the chat into a persistent mode, where the participant is automatically added to the chat input for the next message.
		 */
		isSticky?: boolean;

		/**
		 * An event that fires whenever feedback for a result is received, e.g. when a user up- or down-votes
		 * a result.
		 *
		 * The passed {@link ChatResultFeedback.result result} is guaranteed to be the same instance that was
		 * previously returned from this chat participant.
		 */
		onDidReceiveFeedback: Event<ChatResultFeedback>;

		/**
		 * Dispose this participant and free resources
		 */
		dispose(): void;
	}

	/**
	 * A resolved variable value is a name-value pair as well as the range in the prompt where a variable was used.
	 */
	export interface ChatResolvedVariable {

		/**
		 * The name of the variable.
		 *
		 * *Note* that the name doesn't include the leading `#`-character,
		 * e.g `selection` for `#selection`.
		 */
		readonly name: string;

		/**
		 * The start and end index of the variable in the {@link ChatRequest.prompt prompt}.
		 *
		 * *Note* that the indices take the leading `#`-character into account which means they can
		 * used to modify the prompt as-is.
		 */
		readonly range: [start: number, end: number];

		// TODO@API decouple of resolve API, use `value: string | Uri | (maybe) unknown?`
		readonly values: ChatVariableValue[];
	}

	export interface ChatRequest {

		/**
		 * The prompt as entered by the user.
		 *
		 * Information about variables used in this request are is stored in {@link ChatRequest.variables}.
		 *
		 * *Note* that the {@link ChatParticipant.name name} of the participant and the {@link ChatCommand.name command}
		 * are not part of the prompt.
		 */
		readonly prompt: string;

		/**
		 * The name of the {@link ChatCommand command} that was selected for this request.
		 */
		readonly command: string | undefined;

		/**
		 * The list of variables and their values that are referenced in the prompt.
		 *
		 * *Note* that the prompt contains varibale references as authored and that it is up to the participant
		 * to further modify the prompt, for instance by inlining variable values or creating links to
		 * headings which contain the resolved values. vvariables are sorted in reverse by their range
		 * in the prompt. That means the last variable in the prompt is the first in this list. This simplifies
		 * string-manipulation of the prompt.
		 */
		// TODO@API Q? are there implicit variables that are not part of the prompt?
		readonly variables: readonly ChatResolvedVariable[];
	}

	export interface ChatResponseStream {

		/**
		 * Push a markdown part to this stream. Short-hand for
		 * `push(new ChatResponseMarkdownPart(value))`.
		 *
		 * @see {@link ChatResponseStream.push}
		 * @param value A markdown string or a string that should be interpreted as markdown.
		 * @returns This stream.
		 */
		markdown(value: string | MarkdownString): ChatResponseStream;

		/**
		 * Push an anchor part to this stream. Short-hand for
		 * `push(new ChatResponseAnchorPart(value, title))`.
		 *
		 * @param value A uri or location
		 * @param title An optional title that is rendered with value
		 * @returns This stream.
		 */
		anchor(value: Uri | Location, title?: string): ChatResponseStream;

		/**
		 * Push a command button part to this stream. Short-hand for
		 * `push(new ChatResponseCommandButtonPart(value, title))`.
		 *
		 * @param command A Command that will be executed when the button is clicked.
		 * @returns This stream.
		 */
		button(command: Command): ChatResponseStream;

		/**
		 * Push a filetree part to this stream. Short-hand for
		 * `push(new ChatResponseFileTreePart(value))`.
		 *
		 * @param value File tree data.
		 * @param baseUri The base uri to which this file tree is relative to.
		 * @returns This stream.
		 */
		filetree(value: ChatResponseFileTree[], baseUri: Uri): ChatResponseStream;

		/**
		 * Push a progress part to this stream. Short-hand for
		 * `push(new ChatResponseProgressPart(value))`.
		 *
		 * @param value
		 * @returns This stream.
		 */
		// TODO@API is this always inline or not
		// TODO@API is this markdown or string?
		// TODO@API this influences the rendering, it inserts new lines which is likely a bug
		progress(value: string): ChatResponseStream;

		/**
		 * Push a reference to this stream. Short-hand for
		 * `push(new ChatResponseReferencePart(value))`.
		 *
		 * *Note* that the reference is not rendered inline with the response.
		 *
		 * @param value A uri or location
		 * @returns This stream.
		 */
		// TODO@API support non-file uris, like http://example.com
		// TODO@API support mapped edits
		reference(value: Uri | Location): ChatResponseStream;

		/**
		 * Pushes a part to this stream.
		 *
		 * @param part A response part, rendered or metadata
		 */
		push(part: ChatResponsePart): ChatResponseStream;
	}

	// TODO@API should the name suffix differentiate between rendered items (XYZPart)
	// and metadata like XYZItem
	export class ChatResponseTextPart {
		value: string;
		constructor(value: string);
	}

	export class ChatResponseMarkdownPart {
		value: MarkdownString;
		constructor(value: string | MarkdownString);
	}

	export interface ChatResponseFileTree {
		name: string;
		children?: ChatResponseFileTree[];
	}

	export class ChatResponseFileTreePart {
		value: ChatResponseFileTree[];
		baseUri: Uri;
		constructor(value: ChatResponseFileTree[], baseUri: Uri);
	}

	export class ChatResponseAnchorPart {
		value: Uri | Location | SymbolInformation;
		title?: string;
		constructor(value: Uri | Location | SymbolInformation, title?: string);
	}

	export class ChatResponseProgressPart {
		value: string;
		// TODO@API inline
		constructor(value: string);
	}

	export class ChatResponseReferencePart {
		value: Uri | Location;
		constructor(value: Uri | Location);
	}

	export class ChatResponseCommandButtonPart {
		value: Command;
		constructor(value: Command);
	}

	/**
	 * Represents the different chat response types.
	 */
	export type ChatResponsePart = ChatResponseTextPart | ChatResponseMarkdownPart | ChatResponseFileTreePart | ChatResponseAnchorPart
		| ChatResponseProgressPart | ChatResponseReferencePart | ChatResponseCommandButtonPart;


	export namespace chat {

		/**
		 * Create a new {@link ChatParticipant chat participant} instance.
		 *
		 * @param name Short name by which the participant is referred to in the UI. The name must be unique for the extension
		 * contributing the participant but can collide with names from other extensions.
		 * @param handler A request handler for the participant.
		 * @returns A new chat participant
		 */
		export function createChatParticipant(name: string, handler: ChatRequestHandler): ChatParticipant;

		/**
		 * Register a variable which can be used in a chat request to any participant.
		 * @param name The name of the variable, to be used in the chat input as `#name`.
		 * @param description A description of the variable for the chat input suggest widget.
		 * @param resolver Will be called to provide the chat variable's value when it is used.
		 */
		// TODO@API NAME: registerChatVariable, registerChatVariableResolver
		export function registerVariable(name: string, description: string, resolver: ChatVariableResolver): Disposable;
	}

	/**
	 * The detail level of this chat variable value.
	 */
	// TODO@API maybe for round2
	export enum ChatVariableLevel {
		Short = 1,
		Medium = 2,
		Full = 3
	}

	export interface ChatVariableValue {
		/**
		 * The detail level of this chat variable value. If possible, variable resolvers should try to offer shorter values that will consume fewer tokens in an LLM prompt.
		 */
		level: ChatVariableLevel;

		/**
		 * The variable's value, which can be included in an LLM prompt as-is, or the chat participant may decide to read the value and do something else with it.
		 */
		value: string | Uri;

		/**
		 * A description of this value, which could be provided to the LLM as a hint.
		 */
		description?: string;
	}

	export interface ChatVariableContext {
		/**
		 * The message entered by the user, which includes this variable.
		 */
		prompt: string;
	}

	export interface ChatVariableResolver {
		/**
		 * A callback to resolve the value of a chat variable.
		 * @param name The name of the variable.
		 * @param context Contextual information about this chat request.
		 * @param token A cancellation token.
		 */
		resolve(name: string, context: ChatVariableContext, token: CancellationToken): ProviderResult<ChatVariableValue[]>;
	}
}
