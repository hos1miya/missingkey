export const packedAdvancedMutingSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		muteeId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		mutee: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
		mediaMuted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		renoteMuted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
