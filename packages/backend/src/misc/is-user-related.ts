import type { Note } from '@/models/entities/Note.js';

export function isUserRelated(note: Note | null, userIds: Set<string>): boolean {
	if (!note) return false;

	if (userIds.has(note.userId)) return true;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (note.mentions?.some(userId => userIds.has(userId))) return true;

	if (note.reply && isUserRelated(note.reply, userIds)) return true;

	if (note.renote && isUserRelated(note.renote, userIds)) return true;

	return false;
}
