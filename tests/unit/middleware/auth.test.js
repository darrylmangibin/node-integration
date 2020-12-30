const { User } = require('../../../models/user');
const auth = require('../../../middleware/auth');
const mongoose = require('mongoose');

describe('auth middleware', () => {
	it('should populate req.user with the payload of a valit JWT', () => {
		const user = {
			_id: mongoose.Types.ObjectId().toHexString(),
			isAdmin: true,
		};
		const token = new User(user).generateAuthToken();
		const req = {
			header: jest.fn().mockReturnValue(token),
		};
		const next = jest.fn();
		const res = {};

		auth(req, res, next);

		expect(req.user).toBeDefined();
		expect(req.user).toMatchObject(user);
	});
});
