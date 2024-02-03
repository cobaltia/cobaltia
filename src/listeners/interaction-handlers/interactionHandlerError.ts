import { type Events, type InteractionHandlerError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '#lib/util/functions/interactionErrorHandler';

export class InteractionHandlerErrorListener extends Listener<typeof Events.InteractionHandlerError> {
	public run(error: Error, payload: InteractionHandlerError) {
		return handleInteractionError(error, payload);
	}
}
