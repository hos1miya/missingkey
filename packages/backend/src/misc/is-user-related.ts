import type { Note } from '@/models/entities/Note.js';

export function isUserRelated(note: Note | null, userIds: Set<string>, depth = 0): boolean {
	if (!note) return false;

	// 深さ制限（3回まで）
	if (depth > 3) return false;
	
	if (userIds.has(note.userId)) return true;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (note.mentions?.some(userId => userIds.has(userId))) return true;

	if (note.reply && typeof note.reply === 'object' && isUserRelated(note.reply, userIds, depth + 1)) return true;

	if (note.renote && typeof note.renote === 'object' && isUserRelated(note.renote, userIds, depth + 1)) return true;

	return false;
}
