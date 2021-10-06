const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../server');
const chaiJsonSchemaAjv = require('chai-json-schema-ajv');
chai.use(chaiJsonSchemaAjv);
const url = "http://localhost:80";
const userSchema = require('../schemas/user_schema.json');

describe('API tests', function () {
    
    before(function () {
        server.start();
    })

    after(function () {
        server.close();
    })

    describe('POST /signup', function () {
        it('should create a new user', function (done) {
            chai.request(url)
            .post('/signup')
            .send({
                "username": "user", 
                "email": "user@example.com",
                "password": "12345678"
            })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                done();
            });
        });

        // Password is too short
        it('should give badRequest', function (done) {
            chai.request(url)
            .post('/signup')
            .send({
                "username": "user", 
                "email": "user@example.com",
                "password": "12345" 
            })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
        });
    });

    describe('POST /login', function () {
        it('should log the user in', function (done) {
            chai.request(url)
            .post('/login')
            .auth("user", "12345678")
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    describe('POST /posting', function () {
        it('should create a new posting', function (done) {
            chai.request(url)
            .post('/posting')
            .auth("user", "12345678")
            .send({
                "title": "kettle", 
                "description": "a used kettle",
                "category": "kitchenware",
                "location": "Oulu", 
                "images": [],
                "price": 12.5,
                "delivery": "pickup",
                "contact": {"name": "nimi", "phone": "0501234567" }
            })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                done();
            });
        });

        // Price should be a number
        it('should receive status 400', function (done) {
            chai.request(url)
            .post('/posting')
            .auth("user", "12345678")
            .send({
                "title": "kettle", 
                "description": "a used kettle",
                "category": "kitchenware",
                "location": "Oulu", 
                "images": [],
                "price": "12.5",
                "delivery": "pickup",
                "contact": {"name": "nimi", "phone": "0501234567" }
            })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
        });

        // User should be authenticated
        it('should receive status 401', function (done) {
            chai.request(url)
            .post('/posting')
            .send({
                "title": "kettle", 
                "description": "a used kettle",
                "category": "kitchenware",
                "location": "Oulu", 
                "images": [],
                "price": "12.5",
                "delivery": "pickup",
                "contact": {"name": "nimi", "phone": "0501234567" }
            })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                done();
            });
        });
    });
    
    var postingId = "";
    describe('GET /postings', function () {
        it('should return all of the postings', function (done) {
            chai.request(url)
            .get('/postings')
            .end(function (err, res) {
                const posting = res.body.slice(-1)[0];
                postingId = posting.id;
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    describe('GET /posting', function () {
        it('should return the posting of given id', function(done) {
            chai.request(url)
            .get(`/posting/${postingId}`)
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        });
    });

    describe('PATCH /posting', function () {
        it('should update the posting', function (done) {
            chai.request(url)
            .patch(`/posting/${postingId}`)
            .send({"title": "Another kettle"})
            .auth("user", "12345678")
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    describe('DELETE /posting', function () {
        it('should delete the posting', function (done) {
            chai.request(url)
            .delete(`/posting/${postingId}`)
            .auth("user", "12345678")
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
        });
    });
});
