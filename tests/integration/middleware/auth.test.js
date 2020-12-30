const request = require('supertest');
const { User } = require('../../../models/user');
const { Genre } = require('../../../models/genre');
const mongoose = require('mongoose');

let server;
let token;

describe('auth middleware', () => {
	beforeEach(() => {
		server = require('../../../index');
	});
	afterEach(async (done) => {
		token = new User().generateAuthToken();
		await server.close();
		await Genre.remove({});
		done();
	});
	afterAll(async () => {
		await mongoose.connection.close();
	});

	beforeEach(() => {});

	const exec = () => {
		return request(server)
			.post('/api/genres')
			.set('x-auth-token', token)
			.send({ name: 'genre1' });
	};

	it('should return 401 if no token is provided', async () => {
		token = '';

		const res = await exec();

		expect(res.status).toBe(401);
	});

	it('should return 400 if no token is provided', async () => {
		token = 'a';

		const res = await exec();

		expect(res.status).toBe(400);
	});

	it('should return 200 if token is valid', async () => {
		const res = await exec();

		expect(res.status).toBe(200);
	});
});
