import { type Events, type InteractionHandlerParseError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '#lib/util/functions/interactionErrorHandler';

export class InteractionHandlerParseErrorListener extends Listener<typeof Events.InteractionHandlerParseError> {
	public run(error: Error, payload: InteractionHandlerParseError) {
		return handleInteractionError(error, payload);
	}
}
