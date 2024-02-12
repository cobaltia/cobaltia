import { Events, type InteractionHandlerParseError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '#util/functions/interactionErrorHandler';

export class InteractionHandlerParseErrorListener extends Listener<typeof Events.InteractionHandlerParseError> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.InteractionHandlerParseError,
		});
	}

	public async run(error: Error, payload: InteractionHandlerParseError) {
		return handleInteractionError(error, payload);
	}
}
