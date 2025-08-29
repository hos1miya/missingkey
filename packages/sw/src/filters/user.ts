import * as pleaides from 'pleaides-lib';
import * as Acct from 'pleaides-lib/built/acct';

export const acct = (user: pleaides.Acct) => {
	return Acct.toString(user);
};

export const userName = (user: pleaides.entities.User) => {
	return user.name || user.username;
};

export const userPage = (user: pleaides.Acct, path?, absolute = false) => {
	return `${absolute ? origin : ''}/@${acct(user)}${(path ? `/${path}` : '')}`;
};
