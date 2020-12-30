const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

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
		let token;
		let name;

		const exec = async () => {
			return await request(server)
				.post('/api/genres')
				.set('x-auth-token', token)
				.send({ name });
		};

		beforeEach(() => {
			token = new User().generateAuthToken();
			name = 'genre1';
		});

		it('should return 401 if client is not logged in', async () => {
			token = '';
			const res = await exec();

			expect(res.status).toBe(401);
		});

		it('should return 400 if genre is invalid', async () => {
			name = Array(52).join('a');

			const res = await exec();

			expect(res.status).toBe(400);
		});

		it('should save genre if it is valid', async () => {
			await exec();

			const genre = await Genre.find({ name: 'genre1' });

			expect(genre).not.toBeNull();
		});

		it('should return genre if it is valid', async () => {
			const res = await exec();

			expect(res.body).toHaveProperty('_id');
			expect(res.body).toHaveProperty('name', 'genre1');
		});
	});

	describe('DELETE /:id', () => {
		const exec = (id) => {
			return request(server)
				.delete(`/api/genres/${id}`)
				.set('x-auth-token', token);
		};

		it('should delete a genre if valid id is passed', async () => {
			const user = {
				_id: mongoose.Types.ObjectId().toHexString(),
				isAdmin: true,
			};
			const genre = await Genre.create({ name: 'genre1' });

			token = new User(user).generateAuthToken();

			expect(await Genre.countDocuments()).toBe(1);

			const res = await exec(genre._id);

			expect(res.status).toBe(200);
			expect(await Genre.countDocuments()).toBe(0);
		});

		it('should return 403 status if user is not an admin', async () => {
			const genre = await Genre.create({ name: 'genre1' });

			const res = await exec(genre._id);

			expect(res.status).toBe(200);
			expect(await Genre.countDocuments()).toBe(0);
		});
	});

	describe('PUT /:id', () => {
		it('should edit genre if valid id is passed', async () => {
			const user = {
				_id: mongoose.Types.ObjectId().toHexString(),
				isAdmin: true,
			};
			const genre = await Genre.create({ name: 'genre1' });

			token = new User(user).generateAuthToken();

			const res = await request(server)
				.put(`/api/genres/${genre._id}`)
				.set('x-auth-token', token)
				.send({ name: 'new genre' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'new genre')
		});
	});
});
