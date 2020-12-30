const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let server;

describe('/api/genres', () => {
	beforeEach(() => {
		server = require('../../index');
	});
	afterEach(async (done) => {
		await server.close();
		await Genre.remove({});

		done();
	});
	afterAll(async () => {
		await mongoose.connection.close();
	});

	describe('GET /', () => {
		it('should all return all genres', async () => {
			await Genre.collection.insertMany([
				{ name: 'genre1' },
				{ name: 'genre2' },
			]);

			const res = await request(server).get('/api/genres');

			expect(res.status).toBe(200);
			expect(res.body.length).toBe(2);
			expect(res.body.some((genre) => genre.name === 'genre1')).toBeTruthy();
			expect(res.body.some((genre) => genre.name === 'genre2')).toBeTruthy();
		});
	});

	describe('GET /:id', () => {
		it('should return a valid genre if valid id is passed', async () => {
			const genre = new Genre({ name: 'genre1' });
			await genre.save();

			const res = await request(server).get(`/api/genres/${genre._id}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('name', 'genre1');
		});

		it('should return 404 in invalid id is passed', async () => {
			const res = await request(server).get(`/api/genres/1`);

			expect(res.status).toBe(404);
		});
	});

	describe('POST /', () => {
		it('should return 401 if client is not logged in', async () => {
			const res = await request(server)
				.post('/api/genres')
				.send({ name: 'genre1' });

			expect(res.status).toBe(401);
		});

		it('should return 400 if genre is invalid', async () => {
			const token = new User().generateAuthToken();

			const name = Array(52).join('a');

			const res = await request(server)
				.post('/api/genres')
				.set('x-auth-token', token)
				.send({ name });

			expect(res.status).toBe(400);
		});

		it('should save genre if it is valid', async () => {
			const token = new User().generateAuthToken();

			const res = await request(server)
				.post('/api/genres')
				.set('x-auth-token', token)
				.send({ name: 'genre1' });

			const genre = await Genre.find({ name: 'genre1' });

			expect(genre).not.toBeNull();
		});

		it('should return genre if it is valid', async () => {
			const token = new User().generateAuthToken();

			const res = await request(server)
				.post('/api/genres')
				.set('x-auth-token', token)
				.send({ name: 'genre1' });

			expect(res.body).toHaveProperty('_id');
			expect(res.body).toHaveProperty('name', 'genre1');
		});
	});

	describe('DELETE /:id', () => {
		it('should delete a genre if valid id is passed', async () => {
			const { text: token } = await request(server)
				.post('/api/auth')
				.send({ email: 'darryl@gmail.com', password: '123456' });

			const genre = await Genre.create({ name: 'genre1' });

			expect(await Genre.countDocuments()).toBe(1);

			const res = await request(server)
				.delete(`/api/genres/${genre._id}`)
				.set('x-auth-token', token);

			expect(res.status).toBe(200);
			expect(await Genre.countDocuments()).toBe(0);
		});
	});
});
